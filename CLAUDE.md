# kovera-dashboard — Project Guide

Kovera admin dashboard frontend. React 19 + Vite + Tailwind v4, TanStack Query + Axios for data, React Router 7 for routing.

> **Keep this document in sync.** This file is the source of truth for conventions. Any change that affects how the codebase is structured, named, configured, tested, or deployed must update CLAUDE.md in the **same commit** as the change. That includes:
>
> - Adding/removing a dependency that changes how something is done (new state library, new HTTP client, new charting lib).
> - New folder under `src/`, new module category, or a layout change.
> - A new convention, lint rule, or tool command (new `npm` script, new env var, new config file).
> - A new top-level route, new page, or a change in the protected/public route split.
> - Reversing or relaxing an existing rule in this doc.
>
> If you (Claude) make any such change, update the relevant section of CLAUDE.md **before** reporting the task as done. Treat docs drift as a bug.

## Stack

- **Runtime:** Browser (modern evergreen). Node 20+ for tooling.
- **Framework:** React 19 (function components + hooks, no class components except `ErrorBoundary`)
- **Bundler / Dev server:** Vite 8 with `@vitejs/plugin-react`
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` (no separate `tailwind.config.js` — config lives in `src/index.css` using `@theme`)
- **Routing:** React Router 7 (`react-router-dom`)
- **Data fetching / server state:** TanStack React Query v5
- **HTTP client:** Axios (two instances — see [Network layer](#network-layer))
- **Charts:** Recharts
- **Maps:** Leaflet + React-Leaflet
- **Icons:** Lucide React
- **Variant utilities:** `class-variance-authority` + `clsx` + `tailwind-merge` (via the `cn()` helper)
- **Linter / Formatter:** ESLint 9 (flat config) + Prettier (config in [.prettierrc](.prettierrc) — single quotes, 4-space indent, trailing commas)
- **Package manager:** npm
- **Deploy target:** Vercel (SPA — see [vercel.json](vercel.json))

**Language:** JavaScript with JSX (`.jsx`/`.js`). This project is **not** TypeScript. Don't introduce `.ts`/`.tsx` files without buy-in.

## Commands

| Task            | Command            |
| --------------- | ------------------ |
| Install         | `npm install`      |
| Dev (watch)     | `npm run dev`      |
| Build           | `npm run build`    |
| Preview build   | `npm run preview`  |
| Lint            | `npm run lint`     |
| Format          | `npm run format`   |

Dev server defaults to `http://localhost:5173`. The path alias `@` resolves to `./src` (configured in [vite.config.js](vite.config.js)) — use `@/components/...`, not relative `../../../`.

## Repository Layout

```
src/
  main.jsx                   # ReactDOM.createRoot — entry point, mounts <App />
  App.jsx                    # Providers + Router shell (QueryClient, Theme, Toast, Auth, Routes)
  index.css                  # Tailwind v4 imports + @theme tokens + global styles
  assets/                    # Static assets imported by JS (logos, illustrations)
  components/
    ui/                      # Generic, design-system primitives. NO domain knowledge.
      Button.jsx Badge.jsx Card.jsx Input.jsx Textarea.jsx Select.jsx
      Modal.jsx Skeleton.jsx Spinner.jsx Tabs.jsx Toggle.jsx
      SearchBar.jsx Toast.jsx
      index.js               # Barrel export — import from '@/components/ui'
    common/                  # App-specific shared widgets (still no page logic)
      StatCard.jsx DataTable.jsx ErrorBoundary.jsx OfflineBanner.jsx
      ProtectedRoute.jsx KoveraLogo.jsx
      index.js
    layout/                  # Chrome that frames every authenticated page
      DashboardLayout.jsx Header.jsx Sidebar.jsx
      index.js
  context/                   # React Context providers — one file per context
    AuthContext.jsx          # session user + login/logout + idle/expiry timers
    ThemeContext.jsx         # dark/light toggle, persisted
    SidebarContext.jsx       # collapse/expand on desktop, open/close on mobile
  pages/                     # Route-level screens. One file per top-level route.
    Login.jsx Dashboard.jsx Search.jsx Users.jsx Agents.jsx
    Properties.jsx Trades.jsx Settings.jsx
    Engagement.jsx Chains.jsx Referrals.jsx
    AgentAnalytics.jsx ChainManagement.jsx
    ComponentShowcase.jsx    # internal — visual catalogue of UI primitives
  routes/
    index.jsx                # Centralised route table. Add new routes HERE.
  services/
    api/
      index.js               # default axios instance + Auth/Users/Agents/... API objects
      analytics.js           # SEPARATE axios instance (no auth interceptor) for /api/analytics
    hooks/                   # TanStack Query hooks — one file per feature
      useAnalytics.js useDashboardKPI.js
      useUsers.js useAgents.js useProperties.js useTrades.js
      useSearch.js useDebounce.js
  lib/
    utils.js                 # cn() — twMerge(clsx(...)) — the only place to compose Tailwind classes
    tokenStore.js            # sessionStorage-backed JWT store (sole readers: axios interceptors)
    logger.js                # dev-only console wrapper — use INSTEAD of bare console.*
public/                      # Static files copied verbatim to /
index.html                   # Vite entry HTML
vite.config.js               # plugins + @ alias
eslint.config.js             # flat ESLint config
vercel.json                  # SPA rewrite rules for client-side routing
```

**Structural rules** (enforce these — they shape every change):

1. **Three-bucket component split.** `components/ui/` holds generic primitives (no domain awareness — a `<Button>` doesn't know about Users); `components/common/` holds app-specific shared widgets (`StatCard`, `DataTable`); `components/layout/` holds the page frame (`Sidebar`, `Header`, `DashboardLayout`). If a component is used by exactly one page, keep it co-located in or beside that page file — don't promote to `common/` until a second caller appears.
2. **Pages are the only thing that hits hooks + API directly.** Components in `ui/`/`common/`/`layout/` receive data via props. Don't call `useUsers()` from inside a `<DataTable>`; let the page own the query and pass the result down.
3. **Network layer is three-tier.** All HTTP goes through `src/services/api/`. Three axios instances, by intent: `api` (default, in `index.js` — auth interceptor + 401/403/5xx toast handling) for authenticated app endpoints; `analyticsClient` (`analytics.js` — **no** auth interceptor) for the public `/api/analytics/*` routes; and `authClient` (in `index.js`, dedicated to ms-auth — **no** auth interceptor because login itself is unauthenticated) for `/api/v1/auth/*`. Never call `axios.create` from a page or a component. When adding a new endpoint, extend the matching API object (`authAPI`, `usersAPI`, …) and write a hook to consume it.
4. **Server state lives in React Query, not in `useState`.** New backend data → new hook in `src/services/hooks/<feature>.js` using `useQuery`/`useMutation`. Local UI state (modal open, form draft, selected tab) stays in component state. Don't shove server data into `Context`.
5. **Centralised route table.** Every new route is added to [src/routes/index.jsx](src/routes/index.jsx) — `publicRoutes` for unauthenticated, `protectedRoutes` for everything wrapped in `DashboardLayout`/`ProtectedRoute`. Do **not** edit `App.jsx` to add a `<Route>` directly. New page screens are lazy-loaded by default (`const X = lazy(() => import('@/pages/X'))`); only `Login` and `Dashboard` are eager.
6. **Barrels exist.** Each component bucket exports through `index.js`. Import via the barrel (`import { Button, Card } from '@/components/ui'`), not the leaf path.
7. **One Context per concern, one provider in `App.jsx`.** New context → new file in `src/context/`, mount the provider in `App.jsx` at the right depth (Router-dependent providers like `AuthProvider` go **inside** `<BrowserRouter>` because they call `useNavigate`). Don't wrap providers around individual pages.
8. **Aliases over relatives.** Always import via `@/...`. The only acceptable relative imports are siblings within the same folder.

## Network layer

Three axios instances live in `src/services/api/`:

- **`api`** ([src/services/api/index.js](src/services/api/index.js)) — base URL from `VITE_ANALYTICS_BASE_URL`. Has a request interceptor that attaches `Bearer <token>` from [tokenStore](src/lib/tokenStore.js), and a response interceptor that:
  - On `401`: dispatches `window` event `kovera:auth:unauthorized` (consumed by `AuthContext`, which calls `navigate('/login')` — never do a hard redirect).
  - On `403`: dispatches `kovera:toast` with an "Access Denied" payload.
  - On `>=500`: dispatches `kovera:toast` with a generic server-error payload.
- **`analyticsClient`** ([src/services/api/analytics.js](src/services/api/analytics.js)) — base URL from `VITE_ANALYTICS_BASE_URL`, **no auth interceptor**. The analytics endpoints reject Bearer tokens on some routes, so this instance must stay token-less. Don't merge it back into `api`.
- **`authClient`** ([src/services/api/index.js](src/services/api/index.js)) — base URL from `VITE_MS_AUTH_BASE_URL`, **no auth interceptor** (the `/api/v1/auth/*` endpoints are public). Targets the ms-auth microservice. ms-auth wraps every success body in `{ data: ... }`; the `authAPI` helpers unwrap to the inner payload. Errors arrive as `{ statusCode, error: { code, message }, … }` — surface `error.code` in the UI, never the raw HTTP status.

**Adding a new endpoint:**

1. Pick the right instance (`api` for authenticated app data, `analyticsClient` for `/api/analytics/*`).
2. Add the method to the matching API object in `src/services/api/`:
   ```js
   export const usersAPI = {
     // ...existing
     archive: (id) => api.post(`/users/${id}/archive`),
   };
   ```
3. Add a hook in `src/services/hooks/<feature>.js`. Convention:
   - Queries: `queryKey: ["<resource>", "<sub-key>", params]`, return `.then(r => r.data)` from the `queryFn` so callers receive the data, not the axios response. Default `staleTime: 60_000`.
   - Mutations: invalidate the matching `queryKey` on success via the passed `queryClient`.

**Toast events** — global `window.dispatchEvent(new CustomEvent("kovera:toast", { detail: { type, title, message } }))` is the project-wide way to show a toast from outside React (interceptors, error boundaries, async callbacks). `ToastProvider` ([src/components/ui/Toast.jsx](src/components/ui/Toast.jsx)) listens for it. From inside React, prefer `useToast()`.

## Auth flow

- **Backend:** ms-auth (slice 9). The dashboard authenticates **only** via passwordless email-OTP — `POST /auth/login` (password) exists on the server but is not called from the dashboard. Three endpoints, in order:
  1. `POST /api/v1/auth/otp-login/start` `{ email }` → `200 { message }` or `404 email_not_found` (deliberately leaky — we show "no such account" before the OTP step).
  2. `POST /api/v1/auth/otp-login/verify` `{ email, code }` → returns one of two shapes (discriminated by `kind`):
     - `{ kind: 'session', accessToken, refreshToken, expiresIn, account, identity }` when the account has exactly one identity.
     - `{ kind: 'identitySelection', identitySelectionToken, expiresIn, identities[] }` when it has more than one — the dashboard renders a picker.
  3. `POST /api/v1/auth/otp-login/claim` `{ identitySelectionToken, identityId }` → `{ accessToken, refreshToken, expiresIn, account, identity }`. Only used after a multi-identity verify.
  Plus `POST /api/v1/auth/logout` `{ refreshToken }` → 204. No `/me` endpoint yet. There is **no sign-up UI**: accounts are created manually by an admin.
- **Login UI is a three-step state machine:** email → OTP → (conditional) identity picker. Implemented in [src/pages/Login.jsx](src/pages/Login.jsx) with local `step` state; one page, three forms. If the claim returns `invalid_identity_selection`, we bounce the user back to step 1 (their token expired — a fresh OTP is required).
- **Storage:** access JWT and opaque refresh token both live in `sessionStorage` via [tokenStore](src/lib/tokenStore.js) (`get`/`set` = access, `getRefresh`/`setRefresh` = refresh). The account object is mirrored under `sessionStorage["auth_user"]` so it survives refresh but not a new tab. We do **not** use `localStorage` for auth — XSS exposure. The `identitySelectionToken` is **never** persisted — it lives only in component state for the duration of the picker step, since it grants no session privileges and expires in 5 minutes.
- **AuthContext API** ([src/context/AuthContext.jsx](src/context/AuthContext.jsx)) exposes three login actions plus `logout` — `requestLoginCode(email)`, `verifyLoginCode(email, code)`, `claimIdentity({ identitySelectionToken, identityId })`. There is no `login(email, password)` action; do not reintroduce one. The provider also schedules an auto-logout timer for the JWT's `exp` and an idle-logout timer (30 min), and listens for `kovera:auth:unauthorized` events from the axios interceptor.
- **Session validation on mount.** On every full-page load the provider calls `POST /api/v1/auth/refresh` with the stored refresh token instead of trusting the cached JWT. A 200 swaps in a fresh access/refresh pair and keeps the cached user; a 401 means the server has revoked the session (or disabled the account) and triggers an immediate local logout + bounce to `/login`. A network/5xx failure falls back to "trust the cached access token until its `exp`" so the dashboard stays usable when ms-auth is briefly unreachable. The `identitySelectionToken` is not part of this — only the access/refresh pair is.
- **Logout** calls `POST /api/v1/auth/logout` with the refresh token best-effort (fire-and-forget — never blocks the local sign-out; the endpoint is a 204 no-op for unknown tokens). Then it clears both tokens via `tokenStore.clear()` and the cached user.
- **Error surfacing:** ms-auth returns `{ error: { code, message } }`. Each AuthContext action returns `{ success, code, error }` — pages branch on `code` (`email_not_found`, `invalid_or_expired_otp`, `invalid_identity_selection`) rather than message text.
- **Guarding:** `ProtectedRoute` ([src/components/common/ProtectedRoute.jsx](src/components/common/ProtectedRoute.jsx)) wraps the entire dashboard layout. While `loading`, it renders a **skeleton matching the dashboard shell**, not a spinner. When unauthenticated, it redirects to `/login` with the original URL stashed in `location.state.from`.
- **Login** is rendered eagerly (not lazy) because it's the recovery entry point — lazy-loading it would race with a 401-triggered redirect.

## Routing

- Centralised in [src/routes/index.jsx](src/routes/index.jsx) — `publicRoutes`, `protectedRoutes`, `layoutRoute`, `fallbackRoute`.
- `App.jsx` only maps the exported arrays onto `<Route>` elements. **Do not add `<Route>` literals in `App.jsx`.**
- New pages are `lazy()`-imported by default. The `<Suspense>` fallback is `PageSkeleton` (see `App.jsx`) — a skeleton that matches the dashboard's content grid.
- The catch-all (`*`) redirects to `/dashboard`.

## Styling — Tailwind v4

- Tailwind config lives in [src/index.css](src/index.css) via the `@theme` directive — there is **no `tailwind.config.js`**. New design tokens (colors, spacings, radii, shadows) go into `@theme` blocks in `index.css`.
- Compose classes through `cn()` ([src/lib/utils.js](src/lib/utils.js)) — it pipes `clsx()` through `tailwind-merge` so later utilities win. Don't string-concat classNames.
- Variants for stateful primitives (`Button`, `Badge`) use `class-variance-authority` (`cva()`). When adding a new visual variant, extend the existing `cva` map — don't fork a parallel component.
- The app is dark-mode-first. `ThemeProvider` toggles a class on `<html>`. New components should respect both themes via the design tokens (e.g., `bg-surface`, `text-muted`, `border-border`), not hard-coded `bg-gray-900`.

## Coding conventions

### Formatting

- **Indent = 4 spaces, always.** No tabs. Enforced by Prettier (`tabWidth: 4`, `useTabs: false`). New and edited files must use 4-space indent — when touching an older 2-space file, reformat to 4 in the same change rather than mixing styles within a file.
- **Single quotes for strings**, semicolons on, trailing commas everywhere (Prettier handles it — run `npm run format`).
- Don't hand-format what Prettier handles — let the formatter win. Don't reformat unrelated files in a behaviour-change PR, but the file you're editing should leave Prettier-clean.

### JavaScript / JSX

- Function components with hooks. No class components except `ErrorBoundary` (React's pattern requires it).
- Named exports for everything multi-export (UI primitives, hooks, API objects). Default export is reserved for **page components** and the `App` component — these match the route-table import shape.
- No prop-types, no TypeScript — rely on JSDoc for non-obvious shapes. Don't add `prop-types` as a dep.
- Prefer destructured props in the signature: `function Card({ title, children })`. Use `forwardRef` only when a parent legitimately needs the DOM ref (most UI primitives already do — match the pattern).
- Hooks rules apply — `eslint-plugin-react-hooks` is on. Don't suppress its warnings without a comment explaining why.
- **No `console.*` in committed code.** Use [logger](src/lib/logger.js) — `logger.warn/info/error/debug` is a no-op in production builds.
- Env vars: only `import.meta.env.VITE_*` is readable in the browser. Read them once at module scope, not inside hot paths.

### Naming

- **Component files:** `PascalCase.jsx` — `Button.jsx`, `DataTable.jsx`. One default-or-named-exported component per file, name matches filename.
- **Hook files:** `camelCase.js` starting with `use` — `useAgents.js`, `useDebounce.js`.
- **Page files:** `PascalCase.jsx` matching the route name — `Users.jsx` for `/users`, `AgentAnalytics.jsx` for `/agent-analytics`.
- **Non-component utilities:** `camelCase.js` — `tokenStore.js`, `utils.js`, `logger.js`.
- **Folders:** lowercase, no separators — `components`, `pages`, `services`.
- **Env vars:** `SCREAMING_SNAKE_CASE`, must be `VITE_`-prefixed to be exposed to the browser.

### Pages

- Thin. Compose `ui`/`common`/`layout` primitives, call hooks, hand data down. No business calculations beyond view-shaping (sorting, filtering, formatting).
- Loading states use `Skeleton*` from `@/components/ui`, not `Spinner`. Spinners are for inline actions (a saving button), not page-level loads.
- Error states are owned by the page — render a meaningful inline message and a retry affordance. The interceptor already toasted at the global level; don't re-toast in the page.

### Components

- Generic primitives (`ui/`) must work in any context — no `useAuth`/`useNavigate`/`useQuery` inside them. Pass behaviour in via props.
- `common/` widgets may use app context (`useAuth`, `useToast`) but still no data fetching. Data is a prop.
- `layout/` is the only place where it's normal to read `useAuth`/`useNavigate`/`useSidebar`.

### Hooks

- One file per feature in `src/services/hooks/`. Export named hooks; no default export.
- Always return the React Query object (`{ data, isLoading, error, ... }`) so callers can read whatever they need. Don't pre-destructure to `data` only.
- Query key first segment is the resource family (`"analytics"`, `"users"`, `"agents"`). Mutations invalidate by family prefix.
- Default `staleTime: 60_000` for analytics; use higher for truly static data, `0` only when stale results would mislead.
- For polling, set `refetchInterval` **and** `refetchIntervalInBackground: false` so we don't burn requests in background tabs.

### Errors

- Synchronous render errors caught by `ErrorBoundary` ([src/components/common/ErrorBoundary.jsx](src/components/common/ErrorBoundary.jsx)) — wraps the whole app in `App.jsx`.
- HTTP errors handled at three levels: interceptor (global side-effects: toast + auth event), hook (decides whether `error` propagates), page (renders the error UI). Don't catch + swallow.
- Never `alert()`. Never `window.confirm()`. Use `Modal` for confirmations.

### Async

- `async/await` over `.then()` chains. Don't mix.
- No floating promises in event handlers — `void asyncFn()` or `.catch(logger.error)`.

### Accessibility

- Buttons are `<button>`, links are `<a>`/`<Link>`. Don't put `onClick` on a `<div>` for nav.
- Every interactive element has a focusable state — the `Button` primitive already handles `focus-visible`.
- Images need `alt`; decorative ones use `alt=""`.
- Modals trap focus and close on Escape — extend `Modal`, don't roll your own.

### Commits & PRs

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`, `build:`, `ci:`.
- Subject ≤ 72 chars, imperative mood. Body explains *why*.
- One concern per PR. UI tweak + new endpoint = two PRs.
- `npm run lint` and `npm run build` must pass locally before opening a PR.

## Environment variables

| Var | Purpose | Required? |
|---|---|---|
| `VITE_ANALYTICS_BASE_URL` | Origin for `api` and `analyticsClient` (analytics + legacy users/agents/properties endpoints). Empty string = same-origin. | Yes for non-local |
| `VITE_MS_AUTH_BASE_URL`   | Origin for the ms-auth `authClient` (the helpers prepend `/api/v1/auth/...`). Empty string = same-origin. | Yes for non-local |

Add new vars to `.env` / `.env.local` (gitignored), document them here in the same commit. They **must** be `VITE_`-prefixed to be readable from the browser.

## Anti-patterns (don't)

- Don't add a `<Route>` directly to `App.jsx` — extend `src/routes/index.jsx`.
- Don't fetch from `axios` directly inside a component or page — go through the API objects in `src/services/api/`.
- Don't put `localStorage.setItem("token", ...)` anywhere — auth tokens go through `tokenStore` (sessionStorage) only.
- Don't read `process.env` — Vite uses `import.meta.env`, and only `VITE_`-prefixed keys are exposed.
- Don't `console.log` in committed code — use `logger`.
- Don't promote a one-caller component to `common/`. Wait for the second use case.
- Don't string-concat Tailwind classes — use `cn()`.
- Don't introduce TypeScript files without a discussion — the project is JS-only by convention.
- Don't add `prop-types`, Redux, Zustand, or a second data layer — React Query + Context is the agreed stack.
- Don't replace the dashboard layout's skeleton fallback with a spinner.
- Don't catch a 401/403/5xx in a hook just to toast it — the interceptor already did.

<!-- CODEGRAPH_START -->
## CodeGraph

CodeGraph builds a semantic knowledge graph of codebases for faster, smarter code exploration.

### If `.codegraph/` exists in the project

**NEVER call `codegraph_explore` or `codegraph_context` directly in the main session.** These tools return large amounts of source code that fills up main session context. Instead, ALWAYS spawn an Explore agent for any exploration question (e.g., "how does X work?", "explain the Y system", "where is Z implemented?").

**When spawning Explore agents**, include this instruction in the prompt:

> This project has CodeGraph initialized (.codegraph/ exists). Use `codegraph_explore` as your PRIMARY tool — it returns full source code sections from all relevant files in one call.
>
> **Rules:**
> 1. Follow the explore call budget in the `codegraph_explore` tool description — it scales automatically based on project size.
> 2. Do NOT re-read files that codegraph_explore already returned source code for. The source sections are complete and authoritative.
> 3. Only fall back to grep/glob/read for files listed under "Additional relevant files" if you need more detail, or if codegraph returned no results.

**The main session may only use these lightweight tools directly** (for targeted lookups before making edits, not for exploration):

| Tool | Use For |
|------|---------|
| `codegraph_search` | Find symbols by name |
| `codegraph_callers` / `codegraph_callees` | Trace call flow |
| `codegraph_impact` | Check what's affected before editing |
| `codegraph_node` | Get a single symbol's details |

### If `.codegraph/` does NOT exist

At the start of a session, ask the user if they'd like to initialize CodeGraph:

"I notice this project doesn't have CodeGraph initialized. Would you like me to run `codegraph init -i` to build a code knowledge graph?"
<!-- CODEGRAPH_END -->
