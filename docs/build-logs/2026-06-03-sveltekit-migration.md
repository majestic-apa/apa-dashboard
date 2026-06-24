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

---

## Update 3 — CSV-backed Mock Data (2026-06-11)

### What was changed

The hardcoded mock arrays for onboarding, contribution, and withdrawal logs were replaced with data loaded from CSV files. Commission totals now derive from the CSV data rather than hardcoded counts.

### Files created or modified

| File | Change |
|------|--------|
| `src/lib/utils/csv.ts` | New — RFC-4180-compatible CSV parser (handles quoted fields, Windows line endings) |
| `src/lib/mock/reports.ts` | Now reads `static/mock-data/*.csv` at server startup; falls back to compact hardcoded arrays if CSVs are absent |
| `src/lib/mock/commission.ts` | Now derives agent counts and lead totals from imported log arrays — no hardcoded numbers |
| `.gitignore` | Added `static/mock-data/` to prevent CSV files from being committed |

### CSV file location and format

```
static/mock-data/
  onboarding_data.csv     — 120 records
  contribution_data.csv   —  80 records
  withdrawal_data.csv     —  40 records
```

These files are **gitignored** — they must be copied manually to `static/mock-data/` on each developer machine.

### CSV column → TypeScript field mapping

| CSV column | Maps to | Notes |
|------------|---------|-------|
| `session_id` | `apa_session_id` | |
| `apa_ref` | `id` | |
| `pfa_ref` | `pfa_ack_ref` (null if empty) | |
| `pfa_ref` segment[1] | `pfa_code` | e.g. "PFA-CIT-xxx" → "CIT" |
| `pfa_name` | fallback for `pfa_code` if `pfa_ref` empty | |
| `status: completed` | `pfa_confirmed` | |
| `status: pending` | `submitted` | |
| `status: rejected` | `rejected` | |
| `product: PPP` | `micro_pension` | onboarding only |
| `product: VC` | `voluntary_contribution` | onboarding only |
| `submitted_at` | `timestamp_submitted` | space→T+Z appended |

### How commission re-calculates from CSV

1. `mock/reports.ts` loads and maps CSV → exports `mockOnboardingLog` and `mockContributionLog`
2. `mock/commission.ts` imports those arrays and scans for `status === 'pfa_confirmed'`
3. Counts per `agent_code` → derives direct and override commissions via `COMMISSION_RATES`
4. No hardcoded counts anywhere — the numbers are fully data-driven

### How to regenerate or replace CSV files

Drop replacement CSVs into `static/mock-data/` and restart the dev server (`npm run dev`). The new counts are picked up automatically.

### Fallback behaviour

If `static/mock-data/` is missing or a CSV fails to parse, `tryLoad()` in `reports.ts` logs a warning and exports the built-in 10/9/8-record fallback arrays. The dev server continues to function without the CSVs.

---

## Update 4 — Agent Type Terminology Rename + Real FastAPI Integration (2026-06-23)

### What was changed

Two related tasks completed in one session: (1) renamed all internal agent-type terminology to match the FastAPI naming convention, and (2) wired the real FastAPI endpoints for auth, staff, and agents while keeping reports on mock.

---

### Part A — Terminology Rename

The old `super_agent` / `sub_agent` naming was replaced throughout the codebase to match what the real API uses.

| Old | New |
|-----|-----|
| `agent_type: 'super_agent'` | `agent_type: 'lead'` |
| `agent_type: 'sub_agent'` | `agent_type: 'field'` |
| `super_agent_id` | `lead_agent_id` |
| `super_agent_name` | `lead_agent_name` |
| `super_agent_code` | `lead_agent_code` |
| Query param `?type=super_agent` | `?agent_type=lead` |
| Query param `?type=sub_agent` | `?agent_type=field` |
| Form field `name="super_agent_id"` | `name="lead_agent_id"` |
| Label "Lead (Super Agent)" | "Lead" |

Files modified:

| File | Change |
|------|--------|
| `src/lib/types/index.ts` | Updated `Agent.agent_type` union, renamed three `super_agent_*` fields |
| `src/lib/mock/agents.ts` | All 8 agents and 3 leads updated; `AgentActivity` fields renamed |
| `src/lib/mock/reports.ts` | Filter `a.super_agent_id === lead.id` updated to `a.lead_agent_id` |
| `src/lib/api/agents.ts` | Query params updated |
| `src/routes/staff/+page.server.ts` | Form field reads, mock object creation updated |
| `src/routes/staff/+page.svelte` | Table column, modal select updated |

---

### Part B — Real FastAPI Integration

#### Base URL

```
https://staging.majesticpensionagent.tech
```

Set in `.env`:

```
VITE_MOCK_API=false
VITE_API_URL=https://staging.majesticpensionagent.tech
```

#### How to switch between mock and real

| Mode | `.env` setting | Behaviour |
|------|---------------|-----------|
| Mock (default) | `VITE_MOCK_API=true` | All data from local mock arrays and CSV files. Any credentials work. No network calls. |
| Real | `VITE_MOCK_API=false` | Calls FastAPI staging server. Real credentials required. |

Both modes compile and run identically. Switching requires only a `.env` change and `npm run dev` restart.

#### Endpoints wired

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Login | `POST /api/v1/auth/internal/login` | Body: `{ email, password }` |
| Current user | `GET /api/v1/users/me` | Returns user with `is_superuser` |
| Token refresh | `POST /api/v1/auth/refresh` | Body: `{ refresh_token }` |
| Staff list | `GET /api/v1/users` | Assumed -- confirm with Suleiman |
| Staff create | `POST /api/v1/users` | Body includes `password` |
| Staff edit | `PATCH /api/v1/users/{id}` | |
| Staff toggle | `POST /api/v1/users/{id}/toggle` | Replaces separate deactivate/reactivate |
| Password reset | `POST /api/v1/users/{id}/reset-password` | Body: `{ new_password }` |
| Lead list | `GET /api/v1/agents?agent_type=lead` | |
| Field agent list | `GET /api/v1/agents?agent_type=field` | |
| Agent create | `POST /api/v1/agents` | |
| Agent edit | `PATCH /api/v1/agents/{id}` | |
| Agent toggle | `POST /api/v1/agents/{id}/toggle` | Replaces separate deactivate/reactivate |

**What stays on mock:** all reports endpoints (`staffSummary`, `agentSummary`, onboarding/contribution/withdrawal logs, agent network, commission) remain on mock because Suleiman has not yet built these. When ready, update `src/lib/api/reports.ts` strings and set `VITE_MOCK_API=false`.

#### Token refresh flow

1. Login response returns `access_token` (7-day), `refresh_token` (30-day), and `device_id`.
2. All three are stored as **httpOnly cookies** -- never exposed to client JavaScript.
3. On every page load, `+layout.server.ts` calls `GET /api/v1/users/me` with the access token.
4. If that returns **401** and a `refresh_token` cookie exists, the layout silently calls `POST /api/v1/auth/refresh`.
5. If refresh succeeds: new `auth_token` and `refresh_token` cookies are written and the page load continues.
6. If refresh fails (expired or revoked): all three cookies are deleted and the user is redirected to `/login`.
7. Logout (`POST /logout`) always deletes all three cookies.

#### Role derivation from `is_superuser`

The FastAPI returns `is_superuser: boolean` instead of a role enum. The `mapApiUser()` function in `src/lib/api/auth.ts` converts this:

```typescript
role: raw.is_superuser
  ? 'super_admin'
  : ((raw.role as User['role']) ?? 'operations')
```

- `is_superuser: true` always maps to `'super_admin'`
- `is_superuser: false` uses the `role` field from the API response if present, falls back to `'operations'`

Confirm with Suleiman that the user endpoint returns a `role` string for non-superusers.

#### Toggle endpoint replacing separate deactivate/reactivate

The real API exposes a single toggle endpoint (`POST .../toggle`) rather than separate deactivate and reactivate endpoints. Both the `deactivateStaff`/`reactivateStaff` and `deactivateLead`/`reactivateLead` and `deactivateAgent`/`reactivateAgent` form actions now call the same toggle function in real mode. The mock still uses separate paths for clarity.

#### Files modified or created

| File | Change |
|------|--------|
| `src/lib/types/index.ts` | `AuthResponse` updated: added `refresh_token: string`, `device_id: string` |
| `src/lib/mock/auth.ts` | `mockAuthResponse` updated with mock `refresh_token` and `device_id` values |
| `src/lib/api/auth.ts` | Rewritten: real endpoints, `mapApiUser()` role derivation, `refreshAccessToken()` |
| `src/lib/api/staff.ts` | Real endpoints added; new `toggleStaff()` function |
| `src/lib/api/agents.ts` | Real endpoints added; new `toggleAgent()` function |
| `src/routes/login/+page.server.ts` | Now sets three cookies: `auth_token` (7d), `refresh_token` (30d), `device_id` (30d) |
| `src/routes/logout/+server.ts` | Now clears all three cookies |
| `src/routes/+layout.server.ts` | Added token refresh flow on 401 before giving up |
| `src/routes/staff/+page.server.ts` | `load()` now calls real API when `MOCK_API=false`; all 13 actions now have real API paths with `try/catch` error handling |

#### How to test with real credentials

```bash
# 1. Set real mode
echo 'VITE_MOCK_API=false' >> .env
echo 'VITE_API_URL=https://staging.majesticpensionagent.tech' >> .env

# 2. Start the server
npm run dev

# 3. Navigate to http://localhost:5173
# 4. Log in with real Majestic APA internal credentials
```

If the staging server is down or credentials are wrong, the login page shows the API error message directly from the response body.

#### Assumptions pending confirmation with Suleiman

- Staff endpoint base path is `/api/v1/users` (not `/api/v1/staff` or similar)
- Agent endpoint base path is `/api/v1/agents`
- Toggle endpoint suffix is `/toggle`
- Password reset body key is `new_password`
- Non-superuser users have a `role` field in the `/users/me` response
- Token refresh endpoint is `POST /api/v1/auth/refresh` with body `{ refresh_token }`

---

## Update 5 -- Role Hierarchy and Team View (2026-06-24)

### What was added

Agent hierarchy (BD -> RM -> Manager -> Lead -> Field Agent) modelled in types and mock data.
New Team page visible only to super_admin and management.

### Type changes (`src/lib/types/index.ts`)

- `AgentType = 'rm' | 'manager' | 'lead' | 'field'` -- replaces inline union in `Agent.agent_type`
- `Agent.agent_type` updated to `AgentType` (was `'lead' | 'field'`)
- `AgentWithHierarchy extends Agent` -- adds `region`, `manager_id`, `rm_id` (all nullable)
- `HierarchyNode` -- recursive tree node: `{ agent: AgentWithHierarchy; children: HierarchyNode[] }`
- `TeamView` -- `{ rms?, managers?, leads?, field_agents? }` each `AgentWithHierarchy[]`
- `CommissionSummaryAgent` -- placeholder for future hierarchy commission reporting
- `Message` -- placeholder for future in-app messaging feature

### Mock data changes (`src/lib/mock/agents.ts`)

Full rewrite. Existing 3 leads and 8 field agents updated to `AgentWithHierarchy[]` -- gained `region`, `manager_id`, `rm_id`.

New exports:
- `mockRMs: AgentWithHierarchy[]` -- 3 RMs (North / South / West regions)
- `mockManagers: AgentWithHierarchy[]` -- 4 Managers (2 per RM for first two RMs)
- `mockFieldAgents` -- alias for `mockAgents`
- `mockHierarchy: HierarchyNode[]` -- partial tree; RM-001 and RM-002 fully populated, RM-003 empty
- `mockTeamViewBD` -- all 3 RMs + 4 Managers + 3 Leads + 8 Field Agents
- `mockTeamViewRM` -- 2 Managers + 2 Leads + 6 Field Agents (first RM's data)
- `mockTeamViewManager` -- 1 Lead + 3 Field Agents (first Manager's data)

Hierarchy assignment:
- RM-001 (North): MGR-001, MGR-002
- RM-002 (South): MGR-003, MGR-004
- RM-003 (West): no managers yet
- MGR-001 -> Lead SPA-0001 -> APA-0001, APA-0002, APA-0003
- MGR-002 -> Lead SPA-0002 -> APA-0004, APA-0005
- MGR-003 -> Lead SPA-0003 -> APA-0006, APA-0007

### New files

- `src/lib/api/hierarchy.ts` -- `getHierarchy()`, `getMyTeam(role)`, `getTeamCommission()`; all return mock unconditionally (no Suleiman endpoints yet)
- `src/routes/team/+page.server.ts` -- calls `getMyTeam` + `getHierarchy` (BD only); passes `{ team, hierarchy, role }` to page
- `src/routes/team/+page.svelte` -- role-gated views:
  - BD: 4 summary cards + Tree/List/By Region toggle; Tree uses `HierarchyNode[]` with expand/collapse; List has search + region filter; By Region groups agents by `region` field
  - RM: 3 cards + expandable manager table with nested leads and agents
  - Manager: 2 cards + expandable lead table with nested agents

### Other changes

- `src/lib/components/Sidebar.svelte` -- Team link added between Staff and Reports; shown only to `super_admin` and `management` via `visibleLinks = $derived(...)` filter on `link.roles`
- `src/lib/stores/auth.svelte.ts` -- `hasRole(role: string): boolean` added; uses hierarchy array `['field','lead','manager','rm','management','super_admin']`; returns true if user's role index >= required role index

### All mock -- no real API

`src/lib/api/hierarchy.ts` has no `MOCK_API` guard and no `apiRequest` calls.
When Suleiman builds the endpoints, add the guard and call pattern identical to `src/lib/api/staff.ts`.

Endpoints to confirm with Suleiman when ready:
- `GET /api/v1/hierarchy` -- full tree for BD
- `GET /api/v1/agents/my-team` -- filtered team for RM / Manager

### Result

`npm run check` -- 620 files, 0 errors, 0 warnings.

---

## Update 6 -- Messaging System (2026-06-24)

### What was built

In-app messaging with three tabs: Inbox, Compose, Complaints. All data is mock only -- no real API endpoints exist yet.

### Types added (`src/lib/types/index.ts`)

- `Message` -- updated (was minimal stub): added `sender_role`, `recipient_ids`, `message_type`, `read_at`; `recipients` gains `'management'` value; `message_type: 'general' | 'complaint' | 'announcement'`
- `MessageThread` -- new; groups messages into a thread (placeholder for future threading)
- `Complaint` -- new; separate from Message; tracks status, response, and responder

### New files

- `src/lib/mock/messages.ts` -- 4 mock messages (2 announcements, 2 general); 3 mock complaints (resolved, in_progress, open); exports `mockUnreadCount`
- `src/lib/api/messages.ts` -- 7 functions with MOCK_API guard: `getMessages`, `sendMessage`, `markAsRead`, `getUnreadCount`, `getComplaints`, `submitComplaint`, `respondToComplaint`; in-memory stores survive for the server instance lifetime so mark-as-read and new messages persist within a session
- `src/routes/messages/+page.server.ts` -- `load()` fetches messages + complaints (complaints gated to super_admin/management); 4 actions: `send`, `markRead`, `complaint`, `respond`
- `src/routes/messages/+page.svelte` -- 3-tab Messages page (described below)

### Messages page tabs

**Inbox** -- shows all messages; search by subject/sender; filter by type (All / Announcements / General); unread messages have navy left border and bold subject; click to expand full body; Mark as Read button on expanded messages (optimistic local update via use:enhance, no page reload); unread count badge on tab title.

**Compose** -- visible to `super_admin` and `management` only; form: subject, message (textarea, min 10 chars), send to (Everyone / Regional Managers / Managers / Leads / Field Agents), message type (General / Announcement), same group only checkbox; success message shown inline after send.

**Complaints** -- two sub-tabs:
- My Complaints: shows complaints where sender_id matches current user; empty state with link to form; submit new complaint form; status badges (open=red, in_progress=amber, resolved=green); shows response when resolved.
- All Complaints: visible to super_admin and management only; table with name, code, subject, status, date, action columns; Respond button expands inline response form per row; optimistic local update on response sent.

### Sidebar / layout changes

- `src/lib/components/Sidebar.svelte` -- Messages link added between Team and Reports (visible to all roles); red badge shows unread count from layout data; `unreadCount?: number` added to props
- `src/routes/+layout.server.ts` -- `getUnreadCount(token)` called after successful auth (wrapped in `.catch(() => 0)` to never block navigation); `unreadCount` added to all return paths including public path (returns 0)
- `src/routes/+layout.svelte` -- passes `data.unreadCount ?? 0` to Sidebar

### Role visibility summary

| Feature | Who can see it |
|---|---|
| Inbox | All authenticated users |
| Compose tab | super_admin, management |
| My Complaints | All authenticated users |
| All Complaints | super_admin, management |
| Respond to complaint | super_admin, management |

### All mock -- no real API

When Suleiman builds endpoints, add MOCK_API guard in `src/lib/api/messages.ts` (same pattern as `staff.ts`). Endpoints to confirm:
- `GET /api/v1/messages` -- paginated inbox
- `POST /api/v1/messages` -- send message
- `PATCH /api/v1/messages/{id}/read` -- mark read
- `GET /api/v1/complaints` -- all complaints (BD only)
- `POST /api/v1/complaints` -- submit complaint
- `PATCH /api/v1/complaints/{id}/respond` -- respond to complaint

### Result

`npm run check` -- 626 files, 0 errors, 0 warnings.


---

## Update 7 -- Commission Payment Schedule (2026-06-24)

### Payment rules

Target: 50 completed onboardings per 2-week period.

- Agent meets 50+: payment scheduled bi-weekly (next period start date)
- Agent below 50: payment rolls to end of current calendar month

### Commission rates (placeholder -- subject to management confirmation)

| Type | Rate |
|---|---|
| Field agent direct | 100 per completed onboarding |
| Lead override | 30 per onboarding done by agents under them |
| Contribution commission | 50 per completed contribution |
| Lead contribution override | 15 per contribution under them |

### Files created

- `src/lib/types/index.ts` -- Added `PaymentPeriod`, `AgentPaymentRecord`, `CommissionPeriodSummary` interfaces
- `src/lib/mock/payments.ts` -- Mock data for current period (Jun 9-22, 8 agents, 87,500 due), previous period (May 26-Jun 8, 92,000 paid), next period (Jun 23-Jul 6, active/empty)
- `src/lib/api/payments.ts` -- Mock-only API: `getCurrentPeriod`, `getPreviousPeriod`, `getNextPeriod`, `getAllPeriods`
- `src/routes/commission/+page.server.ts` -- Loads current, previous, and (for BD roles) all periods
- `src/routes/commission/+page.svelte` -- 3-tab page: Current Period, Payment History, All Periods

### Page design

Three tabs:

1. Current Period -- summary cards (agents, met target, missed, total due), payment rule explanation box, agents table with progress bars
2. Payment History -- previous period summary cards (total paid, agents paid, amount), agents table
3. All Periods (super_admin and management only) -- clickable period cards (previous/current/next), expandable records table below selected card

Table columns: Agent name, Code, Type badge (Lead/Field), Onboardings with progress bar (gold = in progress, green = met), Commission, Rule badge (gold=biweekly, grey=monthly), Payment date, Status badge, Bank account (red "Not set" warning if null)

Rows with no bank account on file are highlighted with a red-tinted background.

### Sidebar

Commission link added to `Sidebar.svelte` after Reports, visible to `super_admin` and `management` only.

### What Suleiman needs to build for real API

- `GET /api/v1/commission/periods` -- list all payment periods with status
- `GET /api/v1/commission/periods/current` -- current period summary + agent records
- `GET /api/v1/commission/periods/previous` -- previous period summary + agent records
- `GET /api/v1/commission/periods/{id}` -- summary for a specific period
- `PATCH /api/v1/commission/records/{id}/status` -- update payment_status for a record (admin only)

When endpoints are ready: add MOCK_API guard in `src/lib/api/payments.ts` (same pattern as `staff.ts`).

### Result

`npm run check` -- 632 files, 0 errors, 0 warnings.

---

## Update 8 -- Agent Profile Features (2026-06-24)

### Files created or modified

- `src/lib/types/index.ts` -- Added `BankAccount` and `TerminationLetter` interfaces
- `src/lib/mock/auth.ts` -- Added `mockBankAccount` and `mockTerminations` exports
- `src/lib/api/profile.ts` -- Created mock-only API: `getBankAccount`, `updateBankAccount`, `getTerminations`, `submitTermination`
- `src/routes/profile/+page.server.ts` -- Extended load to fetch bank account + terminations; added `updateBank`, `terminate`, `quickComplaint` actions
- `src/routes/profile/+page.svelte` -- Added three new sections below existing profile/password cards

### Bank account management

- Read-only display shows bank name, masked account number (last 4 digits only), account name, verification status
- Edit button reveals inline form with validation: account number must be exactly 10 digits (regex `\d{10}`)
- On submit, `flagged_for_update` is set to true and `is_verified` to false until finance processes the update
- Amber warning shown whenever `flagged_for_update` is true
- Edit form closes automatically on successful save via `result.type === 'success'` check in enhance callback

### Complaint submission from profile

- Shortcut form for quick complaint submission (subject + message, min 20 chars)
- Submits to `submitComplaint()` in `messages.ts` -- same store as Messages > Complaints tab
- Success message directs user to track it in Messages > Complaints

### Termination letter flow

- If no existing termination: shows red warning notice + form (reason min 20 chars, effective date min 30 days, confirm checkbox)
- Checkbox must be checked to enable the submit button (HTML required + `bind:checked` + `:disabled`)
- Effective date min attribute set to 30 days from page load (`minTermDate` IIFE)
- Server-side validation also enforces 30-day minimum (fix applied: spec had a mutation bug with `today.setDate()`, fixed with separate Date objects)
- If termination already submitted: shows status card (pending/acknowledged/approved/rejected badge, dates, management response if any)

### New button styles

- `.btn-secondary` -- white background, gray border (for Cancel and Edit actions)
- `.btn-danger` -- red (#dc2626) background (for Submit Termination Letter)

### What Suleiman needs to build for real API

- `GET /api/v1/me/bank-account` -- fetch current user's bank account
- `PATCH /api/v1/me/bank-account` -- update bank account (triggers finance verification workflow)
- `GET /api/v1/me/terminations` -- fetch termination letters for current user
- `POST /api/v1/me/terminations` -- submit new termination letter
- Complaint endpoint already tracked in Update 6 (`POST /api/v1/complaints`)

### Result

`npm run check` -- 633 files, 0 errors, 0 warnings.
