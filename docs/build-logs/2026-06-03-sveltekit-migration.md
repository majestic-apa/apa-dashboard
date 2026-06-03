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
