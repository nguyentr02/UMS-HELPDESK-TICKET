# Implementation Plan (FE) — M31 Helpdesk / Ticket

| Field | Value |
|---|---|
| Module | **M31 — Helpdesk / Ticket** — Front-end only |
| Sources | `docs/brief.md`, `docs/feature-plan.md`, `docs/test-design.md`, `docs/role-permission-matrix.md` |
| Step | Process Step 5 — Implementation plan (`/sc:workflow --detail --persona-architect`) |
| Output of this step | **This document only** — no code (that is Step 6 `/sc:implement`) |
| Stack | Next.js 14 (App Router) · TS · **shadcn/ui (Radix)** · RHF + Zod · TanStack Query · MSW v2 · Vitest+RTL · Playwright |
| Strategy | Systematic, surface-by-surface; shared foundation locked first |
| Starting point | **Greenfield code** — only `docs/` + tooling/config survive the reset; `app/`, `components/`, `lib/`, `mocks/`, `tests/` are rebuilt |

> Architect lens: the foundation (types · API client · MSW · status/transition · RBAC-from-matrix · design tokens · shadcn primitives) is shared by every surface. Build and **test-lock it first**, then each surface is additive and independently shippable.

---

## Status & deviations (2026-05-29)

**Done:** Phases 0–6 (all six feature surfaces) + **Phase 7 (hardening — a11y sweep, e2e, coverage gate)**. A responsive **sidebar shell + top bar** + **red brand accent** throughout. Gates green: `tsc --noEmit` clean · **206 Vitest specs** (incl. a 6-surface `vitest-axe` a11y sweep) · **5 Playwright e2e** (smoke + S2-I1 role nav + S1-I1 create flow) · coverage **83% stmts / 81% branch** (≥ 80% gate met) · `next lint` clean. **Implementation complete.**

**Post-Phase-3 refinements:** **Helpdesk Agent scoping** — an Agent's queue/detail is server-scoped to tickets **assigned to them** (`helpdeskAssigneeId = caller.id`); others → 403 (matrix footnote). Lead/Admin still see all. The mock **role-switcher** now persists the new identity synchronously + `queryClient.clear()`s so no role's cached data leaks across a switch.

**Deviations from this plan (intentional):**
- **shadcn set up manually**, not via `npx shadcn init/add` (CLI is interactive + network-bound). Components are **hand-authored from shadcn sources, per-phase as first used** — not bulk-added in Phase 0. Base color **`neutral`**, light v1.
- **Inter** wired via `next/font/google` (`latin` + `vietnamese` subsets) → `--font-sans` → Tailwind `font-sans` (was deferred during earlier phases; enabled 2026-05-29 after confirming the build-time fetch succeeds). System sans is the fallback.
- **MSW browser worker** wired (`components/providers/msw-ready.tsx` + `public/mockServiceWorker.js`) so the running app serves mock data — added in Phase 2 (not explicitly in the original plan).
- **Sidebar console layout** adopted from [`docs/ui-design/helpdesk-console.html`](../ui-design/helpdesk-console.html): `components/layout/{app-shell,sidebar,role-switcher}`, **responsive** (fixed rail at `md:`, hamburger → `Sheet` drawer below). Replaces the originally-planned top nav.
- **Soft-tint `SeverityBadge`** (emoji-aligned red/orange/yellow/green) instead of solid fills; kept the neutral theme (no blue from the mockup).
- **Role identifiers** are `SV | GV | NV | HelpdeskAgent | HelpdeskLead | DeptStaff | Admin` (matching `role-permission-matrix.md`), not the original `Student/Lecturer/Staff`.
- **Test infra:** `tests/setup.ts` stubs an in-memory `localStorage` per test (Node 25's WebStorage is unreliable under jsdom) + Radix/jsdom polyfills.
- **Phase 3 pickers** originally used a custom native-`<select>` `SearchableSelect` + native `<select>` filters for jsdom-testability. **Superseded 2026-05-29 by the full shadcn migration** (see below): pickers → `Combobox`, filters → `Select` + `ToggleGroup`, bell → `DropdownMenu`. The 5 action dialogs still use shadcn **`Dialog`** (opens in jsdom with the polyfills), so dialog gating/validation stays unit-tested; the Radix dropdown *interactions* moved to Playwright.
- **Full shadcn/ui migration (2026-05-29):** per a standing user directive ("use shadcn for everything"), every native form control was replaced — `Select`/`ToggleGroup`/`Combobox`/`DropdownMenu` (+ `popover`/`command` sources; deps `@radix-ui/react-{select,toggle,toggle-group,dropdown-menu,popover}` + `cmdk`). `SearchableSelect` deleted. ~10 jsdom interaction specs were trimmed to logic+visibility and re-covered by 4 new Playwright specs (`helpdesk-actions`, `admin-routing`, `notifications`, `queue-filter`); the role-switcher e2e helper now opens the Select instead of `selectOption`. Gates after migration: **207 Vitest + 9 Playwright e2e**, `tsc`/lint/build clean.

**Standing rule (memory):** every layout ships **both** a mobile and a desktop variant (mobile-first) — applied in code, not just docs.

**Deps installed:** `class-variance-authority clsx tailwind-merge tailwindcss-animate lucide-react react-hook-form @hookform/resolvers cmdk @radix-ui/react-{slot,label,radio-group,checkbox,dialog,select,toggle,toggle-group,dropdown-menu,popover}`. (`cmdk` + the select/toggle/dropdown/popover Radix deps were added in the 2026-05-29 shadcn migration.)

**Next:** none — all planned phases are implemented. Optional follow-ups (not required for this practice build): wire the remaining deferred `(e2e)` cases (S3–S8 dialog/admin flows, S9-X2 ticket-403-from-notification, S9-I1/S10-I1 round-trips), an `@axe-core/playwright` per-page sweep, and a 320px responsive audit; raise func coverage on the trivial `app/**` page wrappers + `components/auth/role-guard`.

---

## A. Plan decisions (defaults — flag any to change before Step 6)

1. **App Router**, client-side data via TanStack Query inside Client Components; Server Components for shells/layouts only (keeps the bulk testable in Vitest, per `test-design.md` §1.2).
2. **shadcn/ui** as the component foundation (Radix + Tailwind + CVA), components owned in `components/ui/`. **lucide-react** for icons.
3. **React Hook Form + Zod** (`@hookform/resolvers`) via shadcn `Form` for every form/dialog.
4. **Mock SSO** = a role switcher writing a session role; every request assumes session-with-role. **MSW** implements App. A incl. the §2 state machine so 409/422 UX is real.
5. **RBAC = `role-permission-matrix.md`** is the single source of truth; `lib/auth/rbac.ts` implements its `can*` predicates verbatim. If code and matrix diverge, the matrix wins.
6. **Surface build order:** Foundation → Requester → Helpdesk console → Dept Staff → Admin → Notifications/Dashboard → Hardening. (Requester first = highest value, simplest flow; Helpdesk second = most interaction-dense.)
7. **Radix-in-jsdom**: Select/Combobox/DropdownMenu *interactions* are e2e (Playwright); Vitest covers logic + visibility (+ documented polyfills where unavoidable). Per `test-design.md` §1.1.
8. **Light theme v1**; dark tokens present, toggle deferred. Base color: shadcn **neutral** (confirm if you want slate/zinc/stone).

---

## B. Target folder structure

```
feat-helpdesk-ticket/
  components.json                      # shadcn config
  app/
    layout.tsx  globals.css            # root shell, theme tokens (:root/.dark), font (Inter)
    providers.tsx                      # QueryClientProvider · <Toaster/> (Sonner) · SessionProvider
    page.tsx                           # role-aware landing → redirect
    login/page.tsx                     # mock SSO (role switcher)
    (requester)/tickets/{page, new/page, [id]/page}
    (helpdesk)/helpdesk/{queue/page, tickets/[id]/page}
    (staff)/staff/{queue/page, tickets/[id]/page}
    (admin)/admin/{categories/page, routing/page}
    analytics/page                     # dashboard (Lead/Admin)
    notifications/page                 # full list
    forbidden/page  not-found.tsx  error.tsx   # explicit 403/404/500 (never blank)
  components/
    ui/        # shadcn-generated + custom wrappers (see Phase 1)
    layout/    # AppShell, Nav, RoleSwitcher, NotificationBell mount point
    tickets/   # TicketForm, TicketList, TicketDetail, Timeline, AttachmentList, CommentBox
    helpdesk/  # HelpdeskQueue, HelpdeskTicketDetail, TicketActionBar, Assign/Forward/Redirect/SeverityOverride/Close dialogs
    staff/     # StaffQueue, StaffTicketDetail, ProgressButton
    admin/     # CategoryTree, CategoryForm, RoutingTable, RoutingForm
    notifications/ # NotificationBell, NotificationList, NotificationItem
    analytics/ # Dashboard, StatCard, SeverityBars, DeptBars
  lib/
    utils.ts          # cn()
    types/domain.ts   # enums + DTOs (mirror App. A)
    api/              # client.ts, errors.ts, tickets.ts, categories.ts, routing.ts, departments.ts, agents.ts, notifications.ts, analytics.ts
    queries/          # tickets.ts, helpdesk.ts, catalog.ts, notifications.ts, analytics.ts
    auth/             # session.tsx, rbac.ts (matrix), nav.ts, guards
    status/           # status.ts (mappers + VN labels), severity.ts, transitions.ts
    validation/       # schemas.ts
  mocks/              # data.ts, handlers.ts, browser.ts, server.ts
  tests/              # unit/, e2e/, helpers/render.tsx, setup.ts
```

---

## C. Phased build order (each phase: files → tests → checkpoint)

### Phase 0 — Scaffold & shadcn setup  *(blocks all)*
- [ ] Confirm tooling already present (Next/TS/Tailwind/Vitest/Playwright/MSW configs survived the reset).
- [ ] `npx shadcn@latest init` → `components.json`, `lib/utils.ts` (`cn()`), theme variables in `globals.css` (`:root` + `.dark`); patch `tailwind.config.ts` (`darkMode:["class"]`, token colors, `borderRadius`, `tailwindcss-animate`) **keeping the `severity.*` palette**.
- [ ] Add deps: `class-variance-authority clsx tailwind-merge lucide-react tailwindcss-animate cmdk react-hook-form @hookform/resolvers` (+ `@radix-ui/*` pulled by component adds). `sonner` + `zod` already present.
- [ ] `npx shadcn add button input textarea select dialog dropdown-menu badge table card skeleton sonner form label checkbox radio-group command popover pagination tabs tooltip alert`.
- [ ] `tests/setup.ts`: jsdom polyfills for Radix (`scrollIntoView`, `hasPointerCapture`, `ResizeObserver`, `PointerEvent`) + MSW `server.listen`.
- **Tests:** one sample component test (shadcn `Button`) + one Playwright smoke (`/` renders) green.
- **Checkpoint:** app boots; Tailwind+theme tokens apply; a shadcn component renders in a Vitest test.

### Phase 1 — Foundation (shared)  *(blocks 2–6)*  — **the critical phase**
- [ ] `lib/types/domain.ts` — `Severity`, `TicketStatus`, `ExternalStatus`, `Role`, `EventType`, `NotificationType`, DTOs (`Ticket`, `TicketEvent`, `Attachment`, `Category`, `RoutingRule`, `Department`, `UserRef`, `NotificationItem`, `Paginated<T>`, `ApiEnvelope`), `ListTicketsQuery` (mirror App. A).
- [ ] `lib/status/` — `status.ts` (`toExternalStatus`, `EXTERNAL_STATUS_VI`, `INTERNAL_STATUS_VI`, `EVENT_VI`, `OPEN_STATUSES`, `backlogAgeDays`), `severity.ts` (`SEVERITY_META`), `transitions.ts` (`canForwardFrom`/`canRedirectFrom`/`canProgressFrom`/`canCloseFrom`/…).
- [ ] `lib/api/client.ts` (`apiFetch`, `ApiError`, envelope unwrap) + `errors.ts` (`handleMutationError` owning the §8 map) + typed fetchers (`tickets/categories/routing/departments/agents/notifications/analytics`).
- [ ] `lib/auth/` — `session.tsx` (mock SSO + `useSession`/`useRole`), **`rbac.ts` implementing the matrix `can*` predicates verbatim** (incl. `canClose` role-check + a `canCloseTicket(role,user,ticket)` ownership helper), `nav.ts` (`navFor(role)`).
- [ ] `lib/validation/schemas.ts` — Zod schemas + VN copy (`createTicket`, `forward`, `redirect`, `assign`, `close`, `comment`) + attachment rules.
- [ ] `lib/queries/*` — Query keys + hooks; mutation hooks invalidate `detail+history+all`.
- [ ] `mocks/data.ts` + `handlers.ts` — seed (roles, depts, agents, categories incl. "Khác" w/o rule, routing rules, tickets in **every** internal state, notifications) + handlers honoring the **state machine** (assign/forward/redirect/progress/severity/close return correct transitions or **409**) and 422 field errors; `browser.ts`/`server.ts`.
- [ ] `components/ui/*` custom wrappers — `SeverityBadge`, `StatusBadge`, `InternalStatusBadge`, `EmptyState`, `FileUpload`, `AccessDenied`, `DataState` (loading/empty/error/success), `Combobox` (Command+Popover wrapper).
- [ ] `app/layout.tsx` + `providers.tsx` + `components/layout/{AppShell,Nav,RoleSwitcher}` (nav driven by `navFor`).
- **Tests (S2 subset + units):** status/severity/transition mappers; `rbac.ts` table test **driven by the matrix grid** (`test-design.md` §4); `apiFetch` against MSW (401/403/404/409/422/5xx); `handleMutationError`; a11y baseline on primitives. → `M31-FE-S2-H1/E1/E2/E3/E4/X1`.
- **Checkpoint:** types compile; RBAC predicates match the matrix grid 1:1; API client + error map green against MSW; nav renders the right items per role.
- **Risk:** shared code — changes ripple everywhere. **Lock with tests before any surface.** The MSW state machine is the contract's executable form — get transitions/409s right here.

### Phase 2 — Requester UI  *(depends 1)* — Stories **S1**, **S10**(timeline)
- [ ] `TicketForm` (RHF + `zodResolver`, severity radio, `FileUpload` as controlled field, 422→`setError`) + `app/(requester)/tickets/new`.
- [ ] `TicketList` (external statuses, "chỉ chưa hoàn tất" filter, `Pagination`, `DataState`) + `app/(requester)/tickets`.
- [ ] `TicketDetail` + `Timeline` + `AttachmentList` + `CommentBox` + `app/(requester)/tickets/[id]`.
- **Tests:** `S1-H1,E1,E2,E3,E4,X1,X2` · `S10-H1` (timeline) · `S2-X2` (own-ticket-only 403). `S1-I1` e2e.
- **Checkpoint:** create→list→detail green in Vitest+MSW; create flow green in Playwright; DeptStaff can also reach `/tickets/new` (S1-E4).

### Phase 3 — Helpdesk console  *(depends 1)* — Stories **S3, S4, S5, S7**
- [ ] `HelpdeskQueue` (status `Select` + severity checkboxes + assignee `Combobox` + `Table` + `Pagination`) + `app/(helpdesk)/helpdesk/queue` (shared route also reachable by Admin "Tất cả yêu cầu").
- [ ] `HelpdeskTicketDetail` + `TicketActionBar` (controls gated by **role × status**) + the 5 `Dialog`s: `AssignDialog` (Lead-only, agent `Combobox`), `ForwardDialog` (routing-rule preselect), `RedirectDialog` (dept + reason), `SeverityOverrideDialog` (radio), `CloseDialog` (note; **ownership backstop**).
- **Tests:** `S3-*`, `S4-*`, `S5-*`, `S7-*` (incl. 409 refresh on each; `S7-X3` agent-not-assignee hides Close); `S2` Lead-vs-Agent control gating. Radix picker open/pick → Playwright; preselect/filter logic → Vitest units.
- **Checkpoint:** every dialog honors server guards (409 path tested); assign→forward→redirect→close e2e green.
- **Risk:** UI transitions must mirror the §2 machine — never expose a control the current status/role can't perform; 409 is the backstop.

### Phase 4 — Dept Staff view  *(depends 1)* — Story **S6**  ✅ done (2026-05-29)
- [x] `StaffQueue` (`status=open`, dept-scoped) + `StaffTicketDetail` + `ProgressButton` + `CommentBox` + `app/staff/{queue,tickets/[id]}` (flat routes, mirroring the existing `app/helpdesk/*` — no route group).
- [x] **Tests:** `StaffQueue` (S6-E1 dept queue + S2 access-denied), `StaffTicketDetail` (S6-H1 progress visible / S6-X1 no Close / progress hidden when not Assigned / DeptStaff can comment / SV denied), `ProgressButton` (S6-H1 POST + success · **S6-X2 403** not-your-dept → error toast · 409 refresh), + `ticket-scoping` (DeptStaff dept-scoped list).
- [x] **Mock:** added a dept-scoped **Assigned** seed ticket (dep-csvc) so the demo has a progressable ticket; `POST /progress` enforces a DeptStaff dept-scope **403** backstop.
- **Deviation:** the dual-layout `StaffQueue` ships a **mobile card list + desktop table** (standing responsive rule); the requester/helpdesk queues remain table-only (revisit in Phase 7). Comment-with-attachment (S6-E2) is deferred — `CommentBox` is body-only; comments render in the timeline as `Commented` events (test-design §8 Q2 still open).
- **Checkpoint:** mark-In-Progress reflects as **Đang xử lý** on the requester view — verified via the shared `POST /progress` state machine (`Assigned`→`InProgress`); full requester-view e2e lands in Phase 7.

### Phase 5 — Admin console  *(depends 1)* — Story **S8**  ✅ done (2026-05-29)
- [x] `CategoryManager` (tree + add form + delete guard) + `app/admin/categories`; `RoutingManager` (table + add form) + `app/admin/routing` (flat routes, mirroring `app/helpdesk/*`).
- [x] **Tests:** `CategoryManager` (S8-H1 add→tree · S8-X2 dup-name 422 · client short-name blocks · S8-E1 delete disabled when has children · S8-X1 non-Admin denied), `RoutingManager` (S8-E2 add→table · missing-selection blocks · S8-X1 denied). S4 ForwardDialog already cross-checks the default-routing preselect (S8-E2/I1).
- [x] **Mock:** added category & routing-rule **CRUD** handlers — category delete `409`s on children; create/patch reject dup/short names + bad refs (`422`); setting a routing default unsets the category's others; mutations invalidate the catalog so the requester create form + Forward dialog refetch.
- **Deviations:** components named `CategoryManager`/`RoutingManager` (each composes its form + tree/table in one client component + one access gate) rather than split `*Tree/*Form/*Table`. **Category nesting is 1 level** (parent picker lists root categories only). Inline category/routing edit (rename, change dept) is **deferred** — add+delete cover S8; rename/PATCH handlers exist in the mock for later.
- **Checkpoint:** add category → it appears in the tree (invalidate→refetch) and, via the shared `categories` query, on the requester create form; Forward pre-selects the routed dept — covered by S4 (`ForwardDialog`). Full cross-surface flow is the Phase 7 e2e.

### Phase 6 — Notifications + Dashboard  *(depends 1)* — Stories **S9, S10**  ✅ done (2026-05-29)
- [x] `NotificationBell` (unread badge + **plain-state toggle panel**, *not* a Radix `DropdownMenu* — keeps the open/list flow jsdom-testable) + `NotificationList`/`NotificationItem` + `app/notifications`; daily-reminder rendering (severity + age). Bell mounted in the `AppShell` top bar (all breakpoints).
- [x] `analytics/Dashboard` (`StatCard`s + CSS severity/status bars + dept/category breakdowns) + `app/analytics` (gated `canViewDashboard` = Lead/Admin).
- [x] **Tests:** `NotificationBell` (S9-H1 unread badge + newest-first panel · S9-E1 empty), `NotificationList` (S9-E2 daily-reminder severity+age · S9-X1 mark-read failure keeps unread + retry), `Dashboard` (S10-E1 counts/breakdowns · S10-X1 error+retry · S10-X2 SV denied · S10-X3 Agent denied). S10-H1 timeline was covered in Phase 2.
- **Deviations:** the bell uses a **plain `useState` panel** (+ invisible backdrop to close), not a Radix `DropdownMenu`, mirroring the `SearchableSelect` jsdom strategy. **S9-X2** (notification whose ticket now `403`s) and **S9-I1 / S10-I1** (cross-surface increment/decrement, dashboard drill-in) are **deferred to the Phase 7 Playwright e2e**; the FE link routes via `ticketDetailHref(role,id)` and the detail pages already render the `403` state. The analytics summary handler is **not role-gated server-side** — access is FE-gated (`canViewDashboard`); the mock `avgHandlingDays` is a fixed stub.
- **Checkpoint:** dashboard counts render with zero/error/loading states; mark-read invalidates the notifications query so the bell badge updates. Full close→bell→detail→mark-read e2e lands in Phase 7.

### Phase 7 — Hardening & quality gates  ✅ done (2026-05-29)
- [x] **a11y sweep** — `tests/unit/a11y.test.tsx` runs `vitest-axe` over 6 representative surfaces (TicketForm, TicketList, HelpdeskQueue, Dashboard, NotificationList, CategoryManager) → **0 violations** (the `region` + `color-contrast` rules, which need page landmarks/layout jsdom lacks, are out of scope here and belong to a `@axe-core/playwright` page sweep). Fixed: the notification unread dot now uses `role="img"` so its `aria-label` is valid.
- [x] **e2e** — `tests/e2e/` now has the smoke + **S2-I1** (role-switch → nav per the RBAC grid) + **S1-I1** (requester create → lands on *Yêu cầu của tôi* as *Đã tiếp nhận*). `npx playwright test` → **5 passed** (Chromium; webServer auto-starts `npm run dev`).
- [x] **Coverage** — `npm run coverage` → **83.1% stmts · 81.4% branch** on `app/`+`components/`+`lib/` (≥ 80% gate met). Untested remainder is trivial `app/**` page wrappers, `components/auth/role-guard` (unused), and the type-only `lib/types`.
- [x] `tsc --noEmit` + `next lint` clean.
- **Deviations / deferred:** `vitest-axe@0.1.0` ships a broken matcher (empty `extend-expect` runtime + mistyped export), so the sweep asserts on `axe(...).violations` directly instead of `toHaveNoViolations()`. A 320px responsive audit and the remaining `(e2e)` cases (S3–S8 dialogs/admin, S9-X2, S9-I1/S10-I1) are left as optional follow-ups.

---

### Phase 8 — Demo login / logout  *(depends 1; rewires Phase 1 session)* — Story **S11**  *(new — 2026-06-04)*

Adds real session lifecycle on top of the completed shipped surfaces. The mock **role-switcher is removed** — identity comes from the JWT cookie returned by `POST /auth/login`.

**Deployment reality** (per `.env.local` + [helpdesk-deployment](../../../C:/Users/tngoc/.claude/projects/d--work-UMS/memory/helpdesk-deployment.md) memory): the FE already ships against the **deployed BE on Vercel** (`https://ums-helpdesk-api.vercel.app`), NeonDB-backed; MSW is off in prod (`NEXT_PUBLIC_USE_MOCKS=false`) and only intercepts during the Vitest suite. So this phase is **not "local-only first"**: it ships in deploy order — **BE Phase 2.5 first** (auth endpoints + CORS-with-credentials + persona seed on NeonDB), **then FE Phase 8a–c**. The user walks the live URL before any of this is announced as done.

**Cross-origin cookie constraints:**
- FE origin: `https://umshelpdesk.vercel.app`; BE origin: `https://ums-helpdesk-api.vercel.app`. Both on `.vercel.app` (Public Suffix List → no parent-domain cookie). Cookie is **host-only** on the BE origin with `SameSite=None; Secure; HttpOnly`.
- BE CORS must be tightened from the current bare `app.use(cors())` to `cors({ credentials: true, origin: ['https://umshelpdesk.vercel.app', 'http://localhost:3000'] })` — BE Phase 2.5 owns this.
- FE `apiFetch` sends `credentials: 'include'` (Phase 8a).

**Phase 8a — Foundation rewire** *(production path is the deployed BE; MSW handlers below are only for the Vitest suite)*

- [ ] `lib/api/client.ts` — every `apiFetch` call sends `credentials: 'include'`. On `401 unauthenticated` from any endpoint other than `/auth/me`, broadcast a `session:expired` event so the AuthGate flips to `/login?next=<current>`.
- [ ] `lib/api/auth.ts` — `loginRequest(body)`, `logoutRequest()`, `fetchMe()`.
- [ ] `lib/queries/auth.ts` — `authKeys = { me: ['auth','me'] }`; `useMeQuery()` (single source of truth for the session); `useLoginMutation()` (sets `authKeys.me` cache then `router.push(homeRouteFor(role))`); `useLogoutMutation()` (calls `/auth/logout`, then `queryClient.clear()`, then `router.push('/login')`).
- [ ] `lib/auth/session.tsx` — rewrite `SessionProvider` to read `useMeQuery`. `useSession()` throws if `user === null` (callers inside an authenticated subtree); add `useSessionOptional()` returning `user | null` for components that may render before/around the gate.
- [ ] `lib/auth/home-route.ts` — `homeRouteFor(role)` (SV/GV/NV → `/tickets/new`, HelpdeskAgent/HelpdeskLead → `/helpdesk/queue`, DeptStaff → `/staff/queue`, Admin → `/admin/categories`).
- [ ] `components/auth/auth-gate.tsx` — top-level guard using `usePathname()` + `useMeQuery()`. Behavior matches FP §11.5 table (anonymous on protected → `/login?next=…`; logged in on `/login` → `homeRouteFor(role)`; `/` and `/login` always public). While `useMeQuery` is loading on first paint, render the loading splash (existing `AppBootGate`).
- [ ] `app/providers.tsx` — mount `AuthGate` between `QueryClientProvider` and the layout shell.
- [ ] **Delete** `components/layout/role-switcher.tsx` and any imports/tests of it. The Playwright `role-switch` helper is replaced by a `loginAs(persona)` helper that hits `POST /auth/login` directly.
- **MSW handlers (mocks/handlers.ts):** add `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` for the **Vitest unit suite only** — `NEXT_PUBLIC_USE_MOCKS=false` in `.env.local` means the browser worker doesn't start, so deployed users always hit the real BE. The MSW seed exports the **same persona list** the BE seeds (kept in sync via `mocks/personas.ts`).

**Phase 8b — Login page + credential helper note**

- [ ] `app/login/page.tsx` — Client Component; redirects to `homeRouteFor(role)` if `useMeQuery` already returns a user. Hosts the form + the slide-down note.
- [ ] `components/auth/login-form.tsx` — RHF + Zod (`email: z.string().email()`, `password: z.string().min(1)`); on submit calls `useLoginMutation`; on 401 surfaces a single non-field-specific error message ("Sai email hoặc mật khẩu"); reads `?next=` from `useSearchParams` and overrides `homeRouteFor(role)` when the role is allowed at `next`.
- [ ] `components/auth/credential-helper-note.tsx` — slide-down panel from the top of `/login`, dismissible via `X` (no localStorage persistence per S11-E2). Tabs by role (SV / GV / NV / HelpdeskAgent / HelpdeskLead / DeptStaff / Admin); each tab lists personas; clicking a persona reveals the seeded password inline and auto-fills the form's `Email` field. Copy is the short blurb from `brief.md` §1 + a practice-mode disclaimer (the same text used on the landing page).
- [ ] `mocks/personas.ts` — exports the 13-persona credentials list (`{ email, password, role, displayName, departmentId? }`) used both by the credential-helper note AND the (Vitest-only) MSW `/auth/login` handler. **Plain text on purpose — these are demo creds.** The BE's `prisma/seed.ts` exports the same shape from a `PERSONAS` constant; keep the two in lockstep.

**Phase 8c — Logout entry points + nav cleanup**

- [ ] `components/layout/top-bar.tsx` — add `Đăng xuất` button (uses `useLogoutMutation`); place where the role-switcher used to live.
- [ ] `components/layout/sidebar.tsx` — add a `Đăng xuất` row in the sidebar footer (icon + text on `md:`, icon-only when collapsed).
- [ ] Update `app/(landing)/page.tsx` if needed so its **Bắt đầu** CTA routes to `/login` (was `/tickets/new` while role-switching was inline) — branch on `useMeQuery` so logged-in visitors still land on their role's home.

**Phase 8d — Test rewrite**

- [ ] Replace `tests/helpers/render.tsx`'s `renderWithProviders({ role })` mock-session injection with **a `setSession(persona)`** helper that pre-populates the `authKeys.me` cache on the per-test `QueryClient`.
- [ ] **Unit + RTL:** `LoginForm` (happy path → push to home, 401 → error toast, `next` honored, role-mismatch falls back), `CredentialHelperNote` (tab switch + persona reveal + dismiss + auto-fill), `AuthGate` (truth table: anonymous on `/login` → render, anonymous on `/tickets/new` → push `/login?next=%2Ftickets%2Fnew`, logged-in on `/login` → push home, logged-in on protected → render).
- [ ] **e2e (`tests/e2e/auth.spec.ts`):** the FE half of `M31-FE-S11-I1` — landing → loading splash → `/login` → pick persona → submit → home; logout from top bar; logout from sidebar; `?next=` round-trip with a deep-link.
- [ ] **Sweep:** every existing Playwright e2e that started with `role-switch` (`helpdesk-actions`, `admin-routing`, `notifications`, `queue-filter`, `S1-I1`, `S2-I1`) now starts with `loginAs(persona)` via the new helper.
- [ ] **Coverage gate** still ≥ 80% after the role-switcher removal.

- **Tests covered:** `M31-FE-S11-H1..I1` from FE Test Design §S11.
- **Checkpoint:** logged-out → any protected route → `/login?next=…`; complete login round-trip; logout from both surfaces; 401 mid-session bounces back to `/login` cleanly; `tsc`/lint/coverage gates still green.

**Phase 8 risk register**
- **Cookie / CORS in prod.** Cross-origin `SameSite=None; Secure; HttpOnly` cookie between `umshelpdesk.vercel.app` (FE) and `ums-helpdesk-api.vercel.app` (BE). Browser drops the cookie unless **all four** are correct: BE sets `Access-Control-Allow-Credentials: true` with a **specific** `Origin` (not `*`), BE cookie has `SameSite=None; Secure`, FE sends `credentials: 'include'`, and the request is HTTPS. Tighten [`src/app.ts:37`](../../../feat-helpdesk-api/src/app.ts#L37) `app.use(cors())` to `cors({ credentials: true, origin: [...] })` — BE Phase 2.5.
- **Cookie / CORS in dev.** BE auto-switches to `SameSite=Lax` + `Secure=false` when `NODE_ENV !== 'production'` (BE Impl Plan Phase 2.5). FE always sends `credentials: 'include'`. Local dev origin `http://localhost:3000` must be in `CORS_ORIGIN`.
- **Stale TanStack cache on logout.** `useLogoutMutation` must `queryClient.clear()` BEFORE `router.push('/login')` — otherwise the next login briefly reads the previous user's cached `/tickets`.
- **AuthGate hydration flash.** Render the `AppBootGate` loading splash while `useMeQuery` is pending; never render protected children with `user === null` mid-redirect.
- **`/auth/me` retry storm.** `useMeQuery` uses `retry: false` for 401 (it's not an error condition, it's the unauthenticated state).

---

### Phase 14 — Admin user directory (read-only)  *(FE-S14 — new, 2026-06-09)*

Admin-only `/admin/users` list + `/admin/users/[id]` detail, built on BE Phase 13's `GET /users[/:id]`. **No mutations yet** (those land in 15/16). Sidebar gets a *Người dùng* entry under Admin's Cấu hình.

- [x] `lib/auth/rbac.ts` — `canViewUsers(role) => role === 'Admin'`. `lib/auth/nav.ts` — `users` nav entry. `lib/types/domain.ts` — `User`, `UserListResponse`, `ListUsersQuery`.
- [x] `lib/api/users.ts` — `listUsers(q)`, `fetchUser(id)`. `lib/queries/users.ts` — `useUsers`, `useUser`, `userKeys`.
- [x] `components/admin/user-directory.tsx` — paged shadcn table + mobile cards; filters in a right-side **FilterDrawer** (mirrors the ticket-list pattern) via `components/admin/user-filters.tsx`. `components/admin/user-detail.tsx` — per-user card.
- [x] `app/admin/users/page.tsx` + `app/admin/users/[id]/page.tsx`. MSW `GET /users[/:id]` handlers; `tests/helpers/render.tsx` seeds `localStorage.m31.mockUser` so handlers see `X-Mock-Role`.
- **Tests:** `M31-FE-S14-X1` non-admin AccessDenied; `H1` table renders + no PII; `H2` search filters; `E1` empty state; `X2/H3/X3` detail (access / found / 404).

### Phase 15 — Admin user create  *(FE-S15 — scope exception, 2026-06-09)*

Admin-only `/admin/users/new` create form on BE Phase 15's `POST /users`. A **+ Tạo người dùng** trigger sits beside the filter drawer.

- [x] `canCreateUsers` RBAC; `createUser` API + `useCreateUser` (invalidates list, primes detail cache).
- [x] `components/admin/user-create-form.tsx` — RHF + zod; email (institutional-domain via `lib/validation/email-domains.ts`), displayName (letters+spaces via `lib/validation/user-name.ts`), role, **Phòng ban shown only for DeptStaff**, optional password w/ reveal. 409 → inline email error; 422 → field errors; success → toast + nav to detail.
- [x] `app/admin/users/new/page.tsx`. Created users surface on the `/login` credential helper via `lib/auth/created-personas.ts` (**identity only — no password persisted**; v1 entries with a password are scrubbed on read).
- [x] MSW `POST /users` (domain + name + dup + revive checks).
- **Tests:** `M31-FE-S15-H1/H2` create (+SSO-only); `H3` directory trigger; `X1` dup email; `X2` short pw; `X3` name digits; `X4` Vietnamese name OK; `X5` personal email; `X6` no Phòng ban for non-DeptStaff. Credential-helper sync `S15-S5..S8`.

### Phase 16 — Admin user edit + soft delete  *(FE-S16 — scope exception, 2026-06-10)*

Admin-only `/admin/users/[id]/edit` + a **Xóa** action on the detail page, on BE Phase 16's `PATCH` / `DELETE`.

- [x] `canUpdateUsers` / `canDeleteUsers`; `updateUser` / `deactivateUser` API + `useUpdateUser` / `useDeactivateUser`.
- [x] `components/admin/user-edit-form.tsx` — prefilled; **email read-only**; sends only changed fields; same name/dept rules; Phòng ban shown only for DeptStaff. `components/admin/user-edit.tsx` shell.
- [x] `components/admin/user-detail.tsx` — **Cập nhật** link + **Xóa** button (disabled when viewing self) + confirm dialog. On delete: `removeCreatedPersona`; on edit: `updateCreatedPersona` (keeps the credential helper in sync).
- [x] MSW `PATCH` + `DELETE` (+ revive + deactivated-exclusion mirror); `__getDeactivatedUserIds` helper.
- **Tests:** `M31-FE-S16-X1` non-admin; `H1` edit + nav; `X2` no-op; `X3/X5` validation; `H2` controls visible; `X4` self-delete disabled; `H3` confirm→delete→list; `H4` deleted excluded from list; `H5` revive on re-create.

> **Ghost-user fix (2026-06-08):** `app/providers.tsx` excludes `["auth","me"]` from the persisted TanStack cache and listens for `m31:session-expired` (fired by `apiFetch` on any non-`/auth/*` 401) to wipe the cache + redirect — so an expired cookie can't show a stale logged-in chrome. Tests: `tests/unit/ApiClient.test.tsx`.

### Phase 17 — DeptStaff close request workflow  *(S17 — new, 2026-06-11)*

DeptStaff who did the work can request a close with proof; the owning Agent/Lead approves or refuses. New 6th status `CloseRequested` (external still `Processing`).

- [x] `lib/types/domain.ts` + `lib/status/status.ts` — `CloseRequested` status (label "Chờ duyệt đóng", purple badge) + `CloseRequested`/`CloseRefused` event & notification types. `lib/status/transitions.ts` — `canRequestCloseFrom` (InProgress) / `canReviewCloseFrom` (CloseRequested); other `*From` guards tightened to the active set so they hide on the paused state.
- [x] `lib/auth/rbac.ts` — `canRequestClose` / `canRequestCloseTicket` (dept match) + `canReviewCloseRequest` (= close ownership).
- [x] `lib/api/tickets.ts` + `lib/queries/helpdesk.ts` — `requestClose` (multipart) / `approveClose` / `refuseClose` + `useRequestClose` / `useApproveClose` / `useRefuseClose`.
- [x] `components/staff/request-close-dialog.tsx` (comment required + image upload) wired into `staff-ticket-detail` (InProgress → button; CloseRequested → "chờ duyệt" banner). `components/helpdesk/review-close-dialog.tsx` (Duyệt đóng / Từ chối) wired into `helpdesk-ticket-detail` (owner + CloseRequested gated).
- [x] MSW `request-close` / `approve-close` / `refuse-close` handlers + `NotificationItem` copy.
- **Tests:** `RequestCloseDialog` (`S17-H1/E1`), `ReviewCloseDialog` (`S17-H2/H3/E2`), `StaffTicketDetail` (`S17-G1..G3`), `HelpdeskTicketDetail` (`S17-G4..G6`).

---

## D. Cross-cutting / shared-code risks

- **Foundation is shared** (Phase 1): types · api client · status/transition · RBAC · tokens · primitives. Change only in Phase 1; cover with tests; treat as stable. Later edits → re-run affected surface suites.
- **State-machine drift:** co-locate status guards in `lib/status/transitions.ts` + role guards in `lib/auth/rbac.ts`. The MSW handlers and these guards must agree; 409 is the runtime backstop.
- **RBAC = matrix:** `rbac.ts` is generated from `role-permission-matrix.md`; the §4 grid test fails loudly if they drift.
- **Radix-in-jsdom:** keep interaction assertions for Radix widgets in Playwright; don't chase Vitest coverage through popovers (`test-design.md` §1.1).
- **shadcn owned code:** generated `ui/` files are committed; keep custom variants in wrapper files, not in regenerated primitives (feature-plan §16).
- **Mock ↔ real BE:** MSW is the executable spec for App. A; FE-driven additions (`GET /departments`, `GET /agents`) are flagged for the BE. Swapping a real BE later changes only `lib/api/*` base/auth.

---

## E. Dependencies to add

- **shadcn runtime:** `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tailwindcss-animate`, `cmdk`, `@radix-ui/*` (via component adds).
- **Forms:** `react-hook-form`, `@hookform/resolvers` (zod already present).
- **Already present:** `next`, `react`, `@tanstack/react-query`, `zod`, `sonner`, `msw`, Vitest/RTL/jsdom/vitest-axe, Playwright/@axe-core/playwright, Tailwind/postcss/autoprefixer, eslint/prettier.

---

## F. Rollback / safety

- Greenfield standalone app — no DB/migration. Rollback = revert commit(s).
- Feature flag `NEXT_PUBLIC_HELPDESK_ENABLED` to hide routes/embed.
- **Practice mode:** stop at Phase 7 (tests green) — no commit/PR/deploy unless asked.

---

## G. Traceability (phase → stories → test IDs)

| Phase | Stories | Test IDs |
|---|---|---|
| 1 | S2 (subset) | `M31-FE-S2-H1/E1/E2/E3/E4/X1` + unit (mappers, rbac grid, api-client, error-map) |
| 2 | S1, S10(timeline) | `S1-*`, `S10-H1`, `S2-X2` |
| 3 | S3, S4, S5, S7 | `S3-*`, `S4-*`, `S5-*`, `S7-*` (incl. `S7-X3`) |
| 4 | S6 | `S6-*` |
| 5 | S8 | `S8-*` |
| 6 | S9, S10 | `S9-*`, `S10-E1/E2/X1/X2/X3/I1` |
| 7 | all | a11y + coverage gates |
| 8 | S11 | `S11-H1/H2/E1/E2/E3/X1/X2/X3/I1` |
| 14 | S14 | `S14-H1/H3/E1/X1/X2/X3` (Admin user directory) |
| 15 | S15 | `S15-H1/H2/H3/X1..X6` + credential-helper `S15-S5..S8` (Admin create — scope exception) |
| 16 | S16 | `S16-H1..H5/X1..X5` (Admin edit + soft delete — scope exception) + ghost-user `ApiClient` cases |
| 17 | S17 | `S17-H1/H2/H3/E1/E2` (request + review dialogs) + `S17-G1..G6` (detail gating) |

---

## H. Definition of Done (per surface)

1. All mapped `M31-FE-S*` cases implemented and green (Vitest + the Playwright `(e2e)` ones).
2. Four interaction states present on every list/detail/form.
3. Controls match the RBAC grid for every role (absence asserted).
4. 0 critical axe violations on the surface.
5. `tsc --noEmit` + lint clean; coverage contribution keeps the suite ≥ 80%.

---

*Traceability: ISO M31 v1.1 → Brief → Feature Plan + Role-Permission Matrix → Test Design → **this Implementation Plan** → Tasks. Next per process: **Step 6 — `/sc:implement`** each phase as small units (read every line; run tests as we go), starting at Phase 0/1. Confirm §A decisions (esp. shadcn base color, and the two open questions in `test-design.md` §8) before Step 6.*
