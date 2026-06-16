# Architecture & Codebase Map — M31 Helpdesk / Ticket (FE)

> **Living doc.** What each file/folder does, what each technology does, and how a request flows.
> **Keep it current:** whenever files/deps/structure change, update this doc in the same change (see [keeping this current](#keeping-this-current)).
> **Last updated:** 2026-05-29 — Phases 0–7 complete + **full shadcn/ui migration** (all native form controls replaced by `Select`/`ToggleGroup`/`Combobox`/`DropdownMenu`; Radix dropdown *interactions* now covered by Playwright, jsdom keeps logic+visibility). Responsive sidebar shell + top bar. Helpdesk Agent scoping (assigned-only) + role-switch cache reset.

Front-end only. No real backend — the app codes against a mocked REST contract served by MSW (see [`feature-plan.md` Appendix A](./feature-plan.md)).

---

## 1. Tech — what each piece does

| Technology | Role in this project | Where it lives |
|---|---|---|
| **Next.js 14 (App Router)** | Routing, server-component shells, dev/build server | `app/`, `next.config.mjs` |
| **React 18 + TypeScript** | UI + static types | everywhere; `tsconfig.json` |
| **Tailwind CSS** | Utility styling + design tokens | `tailwind.config.ts`, `app/globals.css`, `postcss.config.mjs` |
| **shadcn/ui** (Radix + CVA) | Accessible component primitives we **own in-repo** (focus-trap, keyboard, ARIA) | `components/ui/*`, `components.json` |
| **Radix UI** (`@radix-ui/react-*`) | Headless behaviour behind shadcn (dialog/sheet, **select, toggle, toggle-group, dropdown-menu, popover**, label, radio-group, checkbox, slot) | transitive under `components/ui/*` |
| **cmdk** | Command palette behind the `Combobox` (searchable agent/dept picker) | `components/ui/{command,combobox}.tsx` |
| **lucide-react** | Icons (per-icon import, tree-shaken) | `components/**` |
| **class-variance-authority** | Typed style variants (`buttonVariants`, `badgeVariants`) | `components/ui/{button,badge,alert,sheet}.tsx` |
| **clsx + tailwind-merge** | `cn()` class merge helper | `lib/utils.ts` |
| **tailwindcss-animate** | Enter/exit animations (Sheet/Dialog) | `tailwind.config.ts` plugin |
| **TanStack Query** | Data fetching, caching, mutations, **409→invalidate** | `lib/queries/*`, `app/providers.tsx` |
| **React Hook Form** + `@hookform/resolvers` | Forms, wired to Zod via shadcn `Form` | `components/ui/form.tsx`, `components/tickets/ticket-form.tsx` |
| **Zod** | One schema per form → client validation **and** server-error mapping | `lib/validation/schemas.ts` |
| **sonner** | Toasts (success / error / 409-refresh) | `components/ui/sonner.tsx` |
| **MSW v2** | Mock backend: same handlers in Node (tests) + browser (dev) | `mocks/*`, `public/mockServiceWorker.js` |
| **Vitest + RTL + jsdom** | Unit + component tests | `tests/unit/*`, `vitest.config.ts`, `tests/setup.ts` |
| **vitest-axe** | Component a11y assertions — `tests/unit/a11y.test.tsx` (assert on `axe(...).violations`; v0.1.0's `toHaveNoViolations` matcher is broken) | `tests/` |
| **Playwright + @axe-core/playwright** | E2E flows + full-page a11y | `tests/e2e/*`, `playwright.config.ts` |

---

## 2. File map — what does what

### `app/` — routes & shell (Next.js App Router)
| File | Responsibility |
|---|---|
| `layout.tsx` | Root HTML shell; imports `globals.css`; renders `Providers` → `AppShell` |
| `globals.css` | Tailwind layers + shadcn theme tokens (`:root`/`.dark`) + `*`/`body` base |
| `providers.tsx` | `QueryClientProvider` + `SessionProvider` + `MswReady` + `<Toaster/>` |
| `page.tsx` | Landing hero |
| `(requester)/tickets/page.tsx` | "My tickets" → `<TicketList/>` |
| `(requester)/tickets/new/page.tsx` | Create — responsive 2-column: `<TicketForm/>` + `<CreateTicketGuide/>` (stacks on mobile) |
| `(requester)/tickets/[id]/page.tsx` | Detail — 2-column: `<TicketDetail/>` + `<RelatedTickets/>` (other open tickets); stacks on mobile |
| `login/page.tsx` | Demo-build login (`<LoginPage/>`) — email + password form + the dismissible slide-down credential helper note (see §5.0 of the Feature Plan) |
| `helpdesk/queue/page.tsx` | Helpdesk intake queue → `<HelpdeskQueue/>` (Agent/Lead/Admin) |
| `helpdesk/tickets/[id]/page.tsx` | Helpdesk ticket detail → `<HelpdeskTicketDetail/>` (internal status + action dialogs) |
| `admin/users/page.tsx` | Admin user directory → `<UserDirectory/>` *(2026-06)* |
| `admin/users/[id]/page.tsx` | Admin per-user detail → `<UserDetail/>` (+ Cập nhật / Xóa actions) |
| `admin/users/[id]/edit/page.tsx` | Admin edit user → `<UserEdit/>` → `<UserEditForm/>` |
| `admin/users/new/page.tsx` | Admin create user → `<UserCreateForm/>` *(scope exception)* |

### `components/ui/` — design-system primitives
- **shadcn primitives (owned):** `button`, `badge`, `card`, `alert`, `skeleton`, `sonner`, `input`, `textarea`, `label`, `form`, `radio-group`, `checkbox`, `table`, `pagination`, `sheet`, `dialog`, **`select`, `toggle`, `toggle-group`, `dropdown-menu`, `popover`, `command`, `combobox`**.
- **No native form controls in feature code** — all dropdowns are shadcn `Select`, multi-toggles are `ToggleGroup`, searchable pickers are `Combobox` (Popover + Command), menus are `DropdownMenu`. The only native control is the hidden `<input type=file>` inside `file-upload` (shadcn has no file input).
- **Custom wrappers (composed from the above):**
  - `severity-badge` / `status-badge` / `internal-status-badge` — the three pill types (soft tints + VN labels)
  - `empty-state` (on `Card`), `access-denied` (on `Alert`), `data-state` (loading/empty/error/success wrapper)
  - `file-upload` (multi-file picker, type/size/count guard)
  - `filter-bar` — shared filter primitives (`FilterPanel` · `FilterRow` · `FilterChipGroup` on `ToggleGroup` · `FilterSelect` on `Select`) used by the requester `TicketFilters` + the `QueueFilters`

### `components/` — composites & shell
| Path | Responsibility |
|---|---|
| `layout/app-shell.tsx` | Responsive frame: fixed sidebar at `md:`, hamburger → `Sheet` drawer below; top bar hosts the `NotificationBell` (all breakpoints) |
| `layout/sidebar.tsx` | `SidebarContent` (header + sectioned nav + user footer) + `Sidebar` (desktop rail) |
| `providers/msw-ready.tsx` | Starts the MSW browser worker before rendering (gates a flash) |
| `auth/role-guard.tsx` | Renders children only if a role predicate passes |
| `auth/auth-gate.tsx` | Route guard — reads `usePathname()` + session `user`; redirects logged-out users hitting protected routes to `/login?next=…`, and logged-in users hitting `/login` back to `homeRouteFor(role)` |
| `auth/login-form.tsx` | The email + password form (RHF + Zod); on submit calls `useLogin()`, on success writes the user into the `authKeys.me` cache and pushes to `next` or the role's home |
| `auth/credential-helper-note.tsx` | The dismissible slide-down note above the form — tabs of roles → personas list → reveal credentials on click; copy sourced from `brief.md` |
| `tickets/ticket-form.tsx` | S1 create flow (RHF + Zod; order: title → category → severity → description → attachments) |
| `tickets/create-ticket-guide.tsx` | Helper panel beside the create form (fill guide + severity explanation) |
| `tickets/ticket-list.tsx` | Requester list — **filter engine** + external-status rows, **responsive** desktop table + mobile cards, pagination. Maps the 3 external statuses → the internal-status sets the API expects |
| `tickets/ticket-filters.tsx` | Requester filter bar — search (`q`), external-status chips, severity chips, category + sort selects, "Xóa lọc" reset (controlled; emits the next filter object) |
| `tickets/ticket-detail.tsx` | Requester detail (header + timeline + attachments + comment) |
| `tickets/related-tickets.tsx` | Detail side panel — the user's other open tickets (empty → "Không còn yêu cầu nào khác.") |
| `tickets/timeline.tsx` · `attachment-list.tsx` · `comment-box.tsx` | Detail sub-parts |
| `helpdesk/helpdesk-queue.tsx` | Intake queue — `QueueFilters` (search/status/severity/category/assignee/sort) + responsive table + mobile cards (internal status) |
| `helpdesk/helpdesk-ticket-detail.tsx` | Internal detail + action bar gated by **role × status** + timeline |
| `helpdesk/{assign,forward,redirect,severity-override,close}-dialog.tsx` | The 5 action dialogs (S3/S4/S5/S7); each = `Dialog` + mutation hook + `handleMutationError` (409→toast+invalidate+close). Assign/Forward/Redirect use the shadcn `Combobox` picker |
| `helpdesk/review-close-dialog.tsx` | S17 — owner (Lead/assigned-Agent) **Duyệt đóng** (optional note → Closed) / **Từ chối** (reason required → InProgress), shown only on `CloseRequested` |
| `staff/request-close-dialog.tsx` | S17 — DeptStaff **Yêu cầu đóng**: comment (required) + optional images (`FileUpload`) → `request-close`; shown only on `InProgress` |
| `helpdesk/redirect-dialog.tsx` | S18 — Agent/Lead **Chuyển phòng khác**: dept picker (excludes current) + reason → `redirect`; shown on `Assigned`/`InProgress` |
| `helpdesk/review-redirect-dialog.tsx` | S19 — owner **Duyệt chuyển** (picks the target dept) / **Từ chối** (reason → prior status), shown only on `RedirectRequested` |
| `staff/request-redirect-dialog.tsx` | S19 — DeptStaff **Xin chuyển phòng ban**: reason only → `request-redirect`; shown on `Assigned`/`InProgress` |
| `staff/staff-queue.tsx` | Dept Staff queue (S6) — dept-scoped open queue; **responsive** desktop table + mobile cards |
| `staff/staff-ticket-detail.tsx` | Dept Staff detail (S6) — internal status + only the Mark-In-Progress action + comment (no assign/forward/redirect/close) |
| `staff/progress-button.tsx` | "Bắt đầu xử lý" — `POST /progress` (`Assigned`→`InProgress`); 403 (not your dept)/409 → refetch + toast |
| `admin/category-manager.tsx` | Admin category tree (S8) — add (optionally under a parent) + delete; **delete guarded** (button disabled when the category has children; server `409` backstop); 422 dup/short name → field error. Responsive form + tree |
| `admin/routing-manager.tsx` | Admin routing rules (S8) — category→department + default flag (drives the Forward preselect); add/delete; setting a default unsets the category's other defaults server-side |
| `admin/user-directory.tsx` · `user-filters.tsx` | Admin user list (S14) — paged table + mobile cards; filters in a right-side `FilterDrawer` (`user-filters` has a `bare` mode) + a **Tạo người dùng** trigger |
| `admin/user-detail.tsx` | Admin per-user view (S14/16) — identity card + **Cập nhật** link + **Xóa** (confirm dialog, disabled on self) |
| `admin/user-create-form.tsx` · `user-edit-form.tsx` | Admin create (S15) / edit (S16) — RHF + Zod; institutional email + letters-only name; Phòng ban only for DeptStaff; create allows optional password, edit keeps email read-only + sends only changed fields |
| `admin/user-edit.tsx` | Edit shell — Admin-gate + `useUser` fetch → `<UserEditForm/>` |
| `notifications/notification-bell.tsx` | Header bell (S9) — unread badge + a shadcn **`DropdownMenu`** panel showing the latest few + "Xem tất cả" (open→list flow is e2e) |
| `notifications/notification-list.tsx` | Newest-first notification list (S9) — loading/empty/error states; `limit` powers the bell's compact panel |
| `notifications/notification-item.tsx` | One row — type-specific copy, unread dot, mark-as-read (with retry), and a role-aware ticket link; `DailyReminder` lists its backlog tickets (severity + age) |
| `analytics/dashboard.tsx` | Module dashboard (S10, Lead/Admin only) — headline `StatCard`s + CSS severity/status bars + dept/category breakdowns; zero/error(+retry)/loading states |
| `analytics/stat-card.tsx` | A single headline metric (`Card`) |

### `lib/` — non-UI logic (the shared core)
| Path | Responsibility |
|---|---|
| `utils.ts` | `cn()` |
| `types/domain.ts` | All enums + DTOs (mirror the mock contract) |
| `api/client.ts` | `apiFetch` (envelope unwrap, `ApiError`, `credentials: 'include'` so the JWT cookie auto-rides) + `BASE_URL` |
| `api/errors.ts` | `handleMutationError` — the cross-cutting 401/403/404/409/422/5xx map (401 → push to `/login`) |
| `api/{tickets,categories,departments,agents,notifications,analytics,auth,users}.ts` | Typed fetchers per endpoint. `auth.ts`: `login({email,password})`, `logout()`, `getMe()`. `users.ts`: `listUsers`/`fetchUser`/`createUser`/`updateUser`/`deactivateUser` *(2026-06)* |
| `queries/{tickets,catalog,helpdesk,notifications,analytics,auth,users}.ts` | TanStack Query keys + hooks. `auth.ts`: `authKeys.me`, `useAuthMe()`, `useLogin()`, `useLogout()`. `users.ts`: `useUsers`/`useUser`/`useCreateUser`/`useUpdateUser`/`useDeactivateUser` |
| `validation/{user-name,email-domains}.ts` | Shared create/edit rules — letters-only name regex + institutional-email allowlist (mirror the BE) |
| `auth/created-personas.ts` | localStorage store surfacing admin-created users on the `/login` helper — **identity only, no password**; synced on edit/delete |
| `auth/session.tsx` | Cookie-backed session: on mount calls `GET /auth/me` (`useAuthMe`), exposes `user \| null` + `isReady` + `isTransitioning`. No local mutable identity state; logout invalidates `authKeys.me` + `queryClient.clear()` so no role's cached data leaks across a switch |
| `auth/rbac.ts` | **Capability predicates — 1:1 with `role-permission-matrix.md`** + `canCloseTicket` ownership |
| `auth/nav.ts` | `navSectionsFor(role)` (sidebar sections) + `ROLE_VI` labels + `ticketDetailHref(role,id)` (role-aware ticket route for notification links) |
| `status/status.ts` | Internal→external map + VN label maps (`EXTERNAL_/INTERNAL_STATUS_VI`, `EVENT_VI`) + `backlogAgeDays` |
| `status/severity.ts` | `SEVERITY_META` (emoji/label/color/order) |
| `status/transitions.ts` | State-machine guards (`canForwardFrom`, `canRedirectFrom`, …) |
| `validation/schemas.ts` | Zod schemas + attachment rules |

### `mocks/` — the mock backend
| File | Responsibility |
|---|---|
| `data.ts` | Seed (depts, categories, agents, routing rules, tickets in every state, notifications) + `appendEvent`/`setStatus` |
| `handlers.ts` | MSW handlers: every contract endpoint (incl. **category & routing-rule CRUD** for Admin), the **state machine (409)**, **validation (422)**, role/ownership **scoping (403)** — requester→own · DeptStaff→dept · **HelpdeskAgent→assigned-to-them** · Lead/Admin→all. Category delete `409`s if it has children; setting a routing default unsets the category's others |
| `server.ts` | Node setup (Vitest) · `browser.ts` | Browser worker (dev app) |

### `tests/`
| Path | Responsibility |
|---|---|
| `setup.ts` | jsdom/Radix polyfills, MSW lifecycle, per-test in-memory `localStorage` stub |
| `helpers/render.tsx` | `renderWithProviders(ui, { role })` |
| `unit/*.test.ts(x)` | logic + component suites (**207 specs**) incl. `a11y.test.tsx` (`vitest-axe` sweep, 0 violations across 6 surfaces). Radix dropdown *interactions* (Select/Combobox/DropdownMenu) live in e2e; jsdom keeps logic + visibility |
| `e2e/*.spec.ts` | Playwright (**9**): `smoke` · `rbac-nav` (S2-I1) · `create-ticket` (S1-I1) · `helpdesk-actions` (S3-I1 assign via Combobox) · `admin-routing` (S8-E2 add via Selects) · `notifications` (bell DropdownMenu) · `queue-filter` (assignee Select). `helpers.ts` = `setRole` via the shadcn Select switcher |

### Config (root)
`components.json` (shadcn) · `tailwind.config.ts` · `postcss.config.mjs` · `next.config.mjs` · `tsconfig.json` (`@/*` alias) · `vitest.config.ts` · `playwright.config.ts` · `.eslintrc.json` · `package.json` · `public/mockServiceWorker.js`.

---

## 3. How a request flows

```
Component (e.g. TicketList)
  → useQuery / useMutation        (lib/queries/*)
    → typed fetcher               (lib/api/tickets.ts …)
      → apiFetch                  (lib/api/client.ts) — sets credentials:'include' (JWT cookie auto-rides), unwraps {data,error,requestId}
        → fetch
          → MSW (tests) / real BE (dev+prod) — BE verifies the cookie via `auth` middleware before the handler runs
        ← envelope                (or non-2xx → ApiError)
  ← data  → render
  ← ApiError → handleMutationError (lib/api/errors.ts) → 401 → router.push('/login'); else toast / form.setError / 409 invalidate
```

**Auth boot:** `SessionProvider` on mount calls `GET /auth/me`. 200 → `user` populated; 401 → `user = null`. `AuthGate` reads `user` + `usePathname()` to enforce the guard table (Feature Plan §11.5). `AppBootGate` keeps the brand splash up until the `me` query resolves.

**RBAC + state machine (UI gating):** `session role` → `lib/auth/rbac.ts` predicates → `navSectionsFor` (sidebar) and per-control visibility; `lib/status/transitions.ts` gates status-dependent controls. The BE's `409`/`403` is the server-side backstop.

**Realtime notification bell (Socket.IO):** `SocketProvider` (mounted inside `AuthGate`) opens a Socket.IO connection to `NEXT_PUBLIC_REALTIME_URL` when a user is signed in, authenticated with a short-lived token from `GET /auth/realtime-token`. On `notification:new` it optimistically prepends to the `['notifications']` cache (`lib/realtime/notifications-cache.ts`, deduped by id) so the bell badge bumps instantly, and fires a `sonner` toast (copy from `lib/notifications/labels.ts`). Every (re)connect invalidates the cache to reconcile missed events; `connect_error` refreshes the token. **Fallback:** the 30s poll in `useNotifications` always runs, and the whole provider is a no-op when `NEXT_PUBLIC_REALTIME_URL` is unset (so dev/tests/mock-mode are unaffected). The socket server is a separate always-on service (`feat-helpdesk-realtime`, on Render) because Vercel serverless can't hold WebSockets; the BE pushes events to it via an internal `POST /emit`.

---

## 4. Conventions

- **Path alias:** `@/*` → repo root.
- **Component files:** kebab-case (`ticket-form.tsx`); exports PascalCase.
- **`"use client"`** on anything with hooks/interactivity; Server Components stay shells.
- **i18n:** Vietnamese copy co-located with components; canonical label maps in `lib/status/status.ts`.
- **Responsive:** every layout ships mobile + desktop (mobile-first); sidebar → `Sheet` drawer below `md:`.
- **shadcn for all UI:** no native `<select>`/`<button>`/`<input>`/`<textarea>` in feature code — use shadcn `Select`/`ToggleGroup`/`Combobox`/`DropdownMenu`/`Button`/`Input`/`Textarea`. Owned shadcn code: keep custom variants in wrapper files, not in generated primitives.
- **Radix-in-jsdom:** Radix dropdowns (`Select`/`Combobox`/`DropdownMenu`) don't open in jsdom → their open→pick *interactions* are asserted in Playwright; Vitest keeps logic + visibility (+gating). `ToggleGroup`/`Dialog`/`RadioGroup` do work in jsdom.

---

## 5. How to add things (quick recipes)

- **New endpoint:** add a fetcher in `lib/api/`, a hook in `lib/queries/`, a handler in `mocks/handlers.ts` (+ seed in `mocks/data.ts`), and a type in `lib/types/domain.ts`.
- **New shadcn primitive:** hand-author from the shadcn source into `components/ui/`, install its `@radix-ui/*` dep, list it in [`feature-plan.md` §7.3](./feature-plan.md) and this map.
- **New surface/screen:** route under `app/(segment)/`, a composite in `components/<surface>/`, gate via `rbac.ts`/`navSectionsFor`, cover with a Vitest suite (+ e2e for the flow).
- **New capability/role rule:** edit `role-permission-matrix.md` first, then `lib/auth/rbac.ts`, then the grid test `tests/unit/rbac.test.ts`.

---

## 6. Keeping this current

When a change adds/moves/removes a file, a dependency, or a tech decision:
1. Update the relevant table/section here (and the **Last updated** line).
2. Keep the other docs aligned: `feature-plan.md` (design), `impl-plans/feat-M31-helpdesk-fe.md` (status/deviations), `test-design.md` (test status), `role-permission-matrix.md` (RBAC), `README.md` (status), and the design reference `ui-design/helpdesk-console.html`.
3. If docs and code disagree, **code + `role-permission-matrix.md` win**; fix the doc.

---

*Related: [`brief.md`](./brief.md) · [`feature-plan.md`](./feature-plan.md) · [`role-permission-matrix.md`](./role-permission-matrix.md) · [`test-design.md`](./test-design.md) · [`impl-plans/feat-M31-helpdesk-fe.md`](./impl-plans/feat-M31-helpdesk-fe.md) · [`ui-design/helpdesk-console.html`](./ui-design/helpdesk-console.html)*
