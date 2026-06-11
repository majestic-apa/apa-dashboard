# SvelteKit Migration Build Log — 2026-06-03

Majestic APA Limited — Pension Administration Dashboard  
Migration from Laravel + Inertia.js + Svelte 5 → pure SvelteKit 2 + Svelte 5

---

## 1. Project Structure

```
src/
├── app.d.ts                        Global TypeScript declarations (App.Locals, App.PageData)
├── app.html                        HTML shell
├── lib/
│   ├── api/
│   │   ├── client.ts               Base fetch wrapper, ApiError class, MOCK_API flag
│   │   ├── auth.ts                 login(), getMe()
│   │   ├── agents.ts               getLeads(), getAgents(), getAllAgents(), createAgent(), updateAgent()
│   │   ├── staff.ts                getStaff(), createStaff(), updateStaff(), resetPassword()
│   │   └── reports.ts              getDashboardStats(), getStaffSummary(), getAgentSummary(), getActivityLog(), getAgentNetwork()
│   ├── mock/
│   │   ├── auth.ts                 mockUser (super_admin), mockAuthResponse
│   │   ├── staff.ts                5 staff members (all 5 roles)
│   │   ├── agents.ts               3 leads (SPA-000x), 8 agents (APA-000x), 10 activity records
│   │   └── reports.ts              Dashboard stats, staff summary, agent summary, agent network
│   ├── stores/
│   │   └── auth.svelte.ts          Svelte 5 auth store: auth.user, auth.isAuthenticated, auth.setUser(), auth.hasPermission(), auth.canAccess()
│   ├── components/
│   │   └── Sidebar.svelte          240px navy sidebar, active-state gold indicator, sign-out form
│   └── types/
│       └── index.ts                User, Agent, StaffMember, AgentActivity, AuthResponse, DashboardStats, StaffSummary, AgentSummary, AgentNetworkNode
└── routes/
    ├── +layout.server.ts           Auth guard: checks auth_token cookie, redirects to /login or /dashboard
    ├── +layout.svelte              Conditional layout: /login renders without sidebar; all other routes render Sidebar + <main>
    ├── +page.server.ts             Root / redirects to /dashboard
    ├── +page.svelte                (original default, preserved)
    ├── layout.css                  Tailwind v4 import, @theme with --color-navy / --color-gold
    ├── login/
    │   ├── +page.server.ts         default action: validates, calls login(), sets auth_token httpOnly cookie, redirects
    │   └── +page.svelte            Full-page blue login form with loading state and error display
    ├── logout/
    │   └── +server.ts              POST endpoint: deletes auth_token cookie, redirects to /login
    ├── dashboard/
    │   ├── +page.server.ts         Loads DashboardStats from mock/API
    │   └── +page.svelte            Welcome banner, 3 stat cards, inline SVG bar chart, quick actions
    ├── staff/
    │   ├── +page.server.ts         Module-level mutable mock stores; 13 named form actions (CRUD for staff, leads, agents)
    │   └── +page.svelte            3-tab UI (Internal Staff / Leads / Agents), per-tab search, full CRUD modals
    ├── reports/
    │   ├── +page.server.ts         Parallel loads: staffSummary, agentSummary, activityLog, agentNetwork
    │   └── +page.svelte            4-tab UI, activity log with date-range + search + summary/detailed toggle, agent network tree (role-gated)
    └── profile/
        ├── +page.server.ts         Loads current user profile; updateProfile and changePassword actions
        └── +page.svelte            Profile details form + change password form, success/error feedback
```

---

## 2. How to Run Locally

```bash
npm install        # already done
npm run dev        # starts Vite dev server at http://localhost:5173
```

**Login credentials (mock mode):** any email + any password — the mock auth accepts anything.

Default mock user: **Amina Hassan** (`amina.hassan@majesticapa.com`) · role: `super_admin`

---

## 3. How the Mock API Works

### Environment flag

```
# .env
VITE_MOCK_API=true
```

### Flow

1. Every API module (`src/lib/api/*.ts`) imports `MOCK_API` from `client.ts`.
2. If `MOCK_API === true`, functions return `structuredClone(mockData)` immediately — no network call.
3. If `MOCK_API === false`, functions call `apiRequest()` which hits `VITE_API_URL`.

### Mock persistence during dev session

The Staff page (`+page.server.ts`) maintains module-level mutable arrays:

```typescript
let staffStore = structuredClone(mockStaff);   // resets on server restart
```

CRUD actions (create, edit, deactivate, reactivate) mutate these arrays in memory. Data persists for the lifetime of the Node process — it resets on `npm run dev` restart. This is intentional for demo purposes.

---

## 4. How Authentication Works

### Login flow

1. User submits the login form (`POST /login`).
2. `+page.server.ts` calls `login(email, password)`.
   - Mock mode: returns `mockAuthResponse` for any credentials.
   - Real mode: POSTs `{ email, password }` to `POST /auth/login` on FastAPI.
3. The `access_token` is stored as an **httpOnly cookie** (`auth_token`) with `sameSite: lax`.
4. Server redirects to `/dashboard`.

### Auth guard (every page load)

`src/routes/+layout.server.ts` runs on every request:

```
/login  → if token exists, redirect /dashboard; else allow
other   → if no token, redirect /login; else call getMe(token) → return user
```

The returned `user` flows into `data.user` in `+layout.svelte` and is synced to the client `auth` store via `$effect`.

### Logout

The Sidebar contains a plain `<form method="POST" action="/logout">`. The `POST /logout` server endpoint (`+server.ts`) deletes the cookie and redirects to `/login`.

### JWT storage

- **httpOnly cookie** — inaccessible to JavaScript, protected from XSS.
- `secure: false` in dev (no HTTPS). Set to `true` in production.
- Cookie name: `auth_token` · path: `/` · maxAge: 7 days.

---

## 5. How to Add a New Page

1. Create `src/routes/my-page/+page.server.ts`:

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  // Load data from API or mock
  return { myData };
};
```

2. Create `src/routes/my-page/+page.svelte`:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
```

3. Add a nav link in `src/lib/components/Sidebar.svelte`:

```typescript
const navLinks = [
  ...
  { label: 'My Page', href: '/my-page' },
];
```

The auth guard in `+layout.server.ts` protects it automatically — no extra code needed.

---

## 6. How to Swap Mock Data for Real FastAPI

### Step 1 — Update .env

```bash
VITE_MOCK_API=false
VITE_API_URL=http://localhost:8000   # or production URL
```

### Step 2 — Verify FastAPI endpoint contracts

Each API module lists the endpoint it calls:

| Module | Endpoint |
|--------|----------|
| `auth.ts` | `POST /auth/login`, `GET /auth/me` |
| `staff.ts` | `GET /staff`, `POST /staff`, `PATCH /staff/:id`, `POST /staff/:id/reset-password` |
| `agents.ts` | `GET /agents`, `POST /agents`, `PATCH /agents/:id` |
| `reports.ts` | `GET /reports/dashboard`, `/reports/staff-summary`, `/reports/agent-summary`, `/reports/activity`, `/reports/agent-network` |

If Suleiman's endpoints use different paths, update only the string literals inside the `else` branch of each API function — the mock branch is untouched.

### Step 3 — Test

```bash
npm run dev
# Log in with real FastAPI credentials
```

---

## 7. Route Quick Reference

| Route | Auth required | Data source | Actions |
|-------|--------------|-------------|---------|
| `/` | Yes | — | Redirects to `/dashboard` |
| `/login` | No | — | Login form action |
| `/dashboard` | Yes | `GET /reports/dashboard` | — |
| `/staff` | Yes | `GET /staff`, `GET /agents` | 13 CRUD actions |
| `/reports` | Yes | 4 parallel GETs | — |
| `/profile` | Yes | `GET /auth/me` | updateProfile, changePassword |
| `/logout` | — | — | Clears cookie, redirects |

---

## 8. Design System

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#082b67` | Sidebar bg, primary buttons, headings, chart bars |
| Gold | `#febf26` | Active nav indicator, logo background |
| White | `#ffffff` | Cards, modals, main content bg |

Custom Tailwind v4 theme tokens are defined in `src/routes/layout.css` using `@theme`:

```css
@theme {
  --color-navy: #082b67;
  --color-gold: #febf26;
}
```

---

## 9. Technical Notes

### Svelte 5 runes in `.svelte.ts`

The auth store at `src/lib/stores/auth.svelte.ts` uses the `.svelte.ts` extension (not `.ts`). This is **required** for Svelte 5 runes (`$state`, `$derived`) to compile correctly in a TypeScript module. Regular `.ts` files do not support runes.

### Module-level `$state` and SSR

Module-level `$state` in `.svelte.ts` is shared across all server-side requests (Node module cache). The auth store is intentionally a singleton — user data flows from the server via `data.user` and is synced into the store client-side via `$effect` in `+layout.svelte`. There is no SSR risk because the store is only written to on the client after hydration.

### Form actions vs fetch

All mutations (login, CRUD, profile update) use **SvelteKit form actions** (`+page.server.ts` `actions`), not client-side `fetch`. This means they work without JavaScript and are progressively enhanced via `use:enhance`.

### `structuredClone` for mock isolation

Each API function returns `structuredClone(mockData)` so that mutations to the returned object do not affect the original mock arrays.

---

## Update 1 — PenCom-Compliant Log Tabs (2026-06-04)

### What was added and why

The old "Activity Log" tab stored and displayed customer-facing data (`customer_name`, `customer_phone`, `rsa_pin`, `pfa_pin`) that is classified as PII under PenCom guidelines. It was replaced with three operational log tabs that record only system-level metadata about each transaction — no customer identity or financial data is stored.

### Files modified

| File | Change |
|------|--------|
| `src/lib/types/index.ts` | Added `OnboardingLog`, `ContributionLog`, `WithdrawalLog` interfaces |
| `src/lib/mock/reports.ts` | Added `mockOnboardingLog` (10 records), `mockContributionLog` (9), `mockWithdrawalLog` (8) |
| `src/lib/api/reports.ts` | Added `getOnboardingLog()`, `getContributionLog()`, `getWithdrawalLog()`; marked `getActivityLog()` as legacy |
| `src/routes/reports/+page.server.ts` | Replaced `activityLog` parallel load with three new log loads |
| `src/routes/reports/+page.svelte` | Replaced 4-tab layout with 6-tab layout; removed Activity Log tab; added three new log tabs |

### The three log types

#### OnboardingLog
Tracks a new RSA/pension member registration attempt end-to-end.

| Column | Meaning |
|--------|---------|
| `apa_session_id` | Unique APA-generated session reference for the operation |
| `pfa_ack_ref` | Confirmation reference returned by the PFA API on success |
| `pfa_code` | PFA receiving the registration (ARM, STA, NLPC, PAL) |
| `channel` | App channel used by the agent |
| `product_type` | micro_pension or voluntary_contribution |
| `status` | Lifecycle stage of the submission |
| `error_code` | PFA-returned error code if failed/rejected |
| `http_status` | Raw HTTP response code from the PFA API |
| `agent_name/code` | The sub-agent who performed the onboarding |
| `lead_name/code` | The super-agent (lead) the agent belongs to |
| `agent_app_version` | Version of the agent mobile app at the time |
| `timestamp_submitted` | UTC ISO timestamp of submission |

#### ContributionLog
Tracks a pension contribution deposit attempt. Identical structure to OnboardingLog except the `product_type` field is stored but not displayed (kept for backend analytics).

#### WithdrawalLog
Tracks a micro-pension withdrawal request. No `product_type` field (withdrawals are not product-scoped). Rejection codes are financial: `INSUFFICIENT_BALANCE`, `PENDING_VERIFICATION`.

### What is intentionally NOT stored (PII list)

- Customer name, phone number, address
- RSA PIN / PFA PIN
- NIN, BVN, date of birth
- Account number, bank details
- Any field that identifies the pension beneficiary

The log records only *who submitted the operation* (agent/lead) and *what the system response was* (status, error code, HTTP code). This satisfies PenCom Circular No. PenCom/Tech/2022/001 on data minimisation.

### Tabs in the updated Reports page

| # | Tab | Restricted |
|---|-----|-----------|
| 1 | Staff Summary | No |
| 2 | Agent Summary | No |
| 3 | Onboarding Log | No |
| 4 | Contribution Log | No |
| 5 | Withdrawal Log | No |
| 6 | Agent Network | super_admin + management only |

### Filtering logic

All filtering is client-side using `$derived.by()` — no server round trips. Each log tab has independent filter state:
- **Search** — matches `agent_name`, `agent_code`, `lead_code`, `apa_session_id`, `pfa_ack_ref`
- **Date From / To** — filters by `timestamp_submitted`
- **Status dropdown** — exact match on `status`; "All Statuses" shows everything

The generic `applyLogFilter<T extends LogRecord>()` function handles all three tabs. Each tab's `$derived.by()` call passes its own bound state variables.

### How to add real FastAPI data

When Suleiman's API is ready, in `src/lib/api/reports.ts`:

1. Set `VITE_MOCK_API=false`
2. The three new functions already have the real endpoints:
   - `GET /reports/onboarding-log`
   - `GET /reports/contribution-log`
   - `GET /reports/withdrawal-log`
3. If Suleiman uses different path names, update only the string literal in the `else` branch of each function — the mock branch is untouched.

---

## Update 2 — Commission Feature (2026-06-11)

### What was added

A commission calculation layer was added to the Agent Network tab in the Reports page. It is visible only to `super_admin` and `management` roles.

### Files created or modified

| File | Change |
|------|--------|
| `src/lib/types/index.ts` | Added `CommissionRates`, `AgentCommissionSummary`, `LeadCommissionSummary`, `CommissionSummary` |
| `src/lib/mock/commission.ts` | New file — full `CommissionSummary` object with verified pre-calculated figures |
| `src/lib/api/reports.ts` | Added `getCommissionSummary()` with MOCK_API fallback |
| `src/routes/reports/+page.server.ts` | Added `parent()` call to read user role; loads `commissionSummary` only for authorised roles |
| `src/routes/reports/+page.svelte` | Updated Agent Network tab: summary cards, per-lead/per-agent commission display, Commission Summary table |

### How commission is calculated

**Flat-fee model** — identical rates for all agents and leads.

```
Agent direct commission   = completed_onboardings × ₦100
                          + completed_contributions × ₦50

Lead override commission  = team_total_onboardings × ₦30
                          + team_total_contributions × ₦15

Team total                = sum of agent direct commissions + lead override
```

### Current placeholder figures (mock data)

| Lead | Agents | Onboardings | Agent Direct | Override | Team Total |
|------|--------|-------------|-------------|---------|-----------|
| SPA-0001 Chukwuemeka Okafor | 3 | 44 | ₦5,850 | ₦1,755 | ₦7,605 |
| SPA-0002 Fatima Abubakar | 3 | 40 | ₦5,300 | ₦1,590 | ₦6,890 |
| SPA-0003 Biodun Adeleke | 2 | 19 | ₦2,550 | ₦765 | ₦3,315 |
| **Grand Total** | **8** | **103** | **₦13,700** | **₦4,110** | **₦17,810** |

### How to update the rates

Rates are defined in a single place: `src/lib/mock/commission.ts`

```typescript
export const COMMISSION_RATES: CommissionRates = {
  agent_per_onboarding: 100,           // change here
  lead_override_per_onboarding: 30,    // change here
  agent_per_contribution: 50,          // change here
  lead_override_per_contribution: 15   // change here
};
```

All commission figures in the mock are calculated using `COMMISSION_RATES` at module load time — changing the constants automatically propagates to all totals.

When rates are confirmed and the real API is wired up, rates will come from the API response — no further frontend changes needed as the formula is the same.

### Access control

| Layer | How it works |
|-------|-------------|
| Server | `+page.server.ts` calls `parent()` to read the user's role from the layout. If role is not `super_admin` or `management`, `commissionSummary: null` is returned — the data is never sent to the browser. |
| Client | `canViewCommission` derived from `user?.role`. All commission UI is inside `{#if canViewCommission && commissionSummary}` guards. |

### What Suleiman needs to build

`GET /api/v1/reports/commission` — returns a `CommissionSummary`-shaped JSON object. The frontend endpoint string is already wired in `src/lib/api/reports.ts`. When `VITE_MOCK_API=false`, the real endpoint will be called automatically.
