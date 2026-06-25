# Test Design (FE) — M31 Helpdesk / Ticket

| Field | Value |
|---|---|
| Module | **M31 — Helpdesk / Ticket** — **Front-end only** |
| Sources | `docs/brief.md`, `docs/feature-plan.md` (§3 personas, §8 states, §11 guards, App. A contract), `docs/role-permission-matrix.md` |
| Step | Process Step 4 — Test design (`/sc:test --design --persona-qa`) |
| Stack under test | Next.js 16 · shadcn/ui (Radix) · React Hook Form + Zod · TanStack Query · MSW v2 |
| Test stack | **Vitest + RTL + jsdom** (unit/component) · **Playwright + @axe-core/playwright** (e2e/RSC/a11y) · **vitest-axe** (component a11y) |
| Backend | **Mocked (MSW)** — cases run against the App. A contract; no real BE |
| Min per Story | ≥1 Happy · ≥2 Edge · ≥2 Error · ≥1 Integration |
| Coverage gate | ≥ 80% statements on new FE code; **0 critical** axe violations |

> This is the **design** (Given/When/Then). Executable specs are written against real components during implementation (`/sc:implement`). Each case carries a stable ID for traceability.
> **Test ID scheme:** `M31-FE-S<story>-<H|E|X|I><n>` — H=Happy, E=Edge, X=Error, I=Integration.

---

## 1. Tooling & test layers

| Layer | Tool | Scope |
|---|---|---|
| Unit / logic | **Vitest** | Pure fns, hooks, Zod schemas, status/severity mappers, RBAC predicates, the `handleMutationError` helper |
| Component (client) | **Vitest + RTL + jsdom** | `"use client"` components — render, props, interaction, validation, role-gated visibility |
| API mocking | **MSW v2** | Intercepts client fetches — App. A endpoints, the `{data,error,requestId}` envelope, error codes (401/403/404/409/422/5xx), and the §2 state machine |
| Integration + E2E | **Playwright** | Full flows, async Server Components, and **Radix-heavy interactions** (see caveat) |
| A11y | **vitest-axe** (component) + **@axe-core/playwright** (page) | 0 critical violations per surface |

### 1.1 shadcn / Radix testing caveat (important)

Radix primitives (`Select`, `Combobox`/`cmdk`, `DropdownMenu`, `Popover`) depend on browser APIs jsdom **doesn't** implement: `PointerEvent`/`hasPointerCapture`, `ResizeObserver`, `scrollIntoView`, `getBoundingClientRect` geometry. Two consequences for this design:

- **Open/pick interactions on `Select` / `Combobox` / `DropdownMenu` are asserted in Playwright** (real browser), not Vitest. Cases that need them are tagged `(e2e)`.
- Where a Vitest case must touch one (e.g. asserting *options are filtered*), the suite installs the standard polyfills in `tests/setup.ts` (`Element.prototype.scrollIntoView`, `hasPointerCapture`, `ResizeObserver`, `PointerEvent`) and drives the widget by **keyboard** (`userEvent.keyboard`) rather than mouse. Cases relying on polyfills are tagged `(jsdom+polyfill)`.
- **Logic is tested separately from the widget**: the agent-filter predicate, the RBAC gate, and the 409 handler are unit-tested as pure functions so coverage doesn't hinge on rendering a Radix popover.

### 1.2 RSC caveat
Per the feature plan, data-fetching lives in **Client Components**, so Vitest+RTL+MSW covers the bulk. Async Server Components (layouts/shells) and full navigations are covered by Playwright only.

### 1.3 Implementation status (2026-06-25)
Phases 0–19 are implemented (the six core surfaces + hardening + full shadcn/ui migration, demo + Google SSO login/logout, the Admin user-management console, and the close/redirect request workflows); **256 Vitest tests across 43 files green** + **Playwright e2e**; coverage ≥ 80% gate; `tsc`/lint/build clean. (Routing-rule management was removed — too rigid for cross-domain tickets — so its tests were dropped.) Notes from building (Phases 0–7 detail retained for history):
- **shadcn-everything (2026-05-29):** all native form controls were replaced — dropdowns → `Select`, multi-toggle filters → `ToggleGroup`, searchable agent/dept pickers → `Combobox` (Popover+cmdk), notification bell → `DropdownMenu`, role-switcher → `Select`. Per §1.1, Radix dropdowns don't open in jsdom, so their open→pick *interactions* moved to Playwright (`helpdesk-actions` S3-I1 assign, `admin-routing` S8-E2, `notifications` bell, `queue-filter` assignee); Vitest keeps logic + visibility (the dialogs still open via Radix `Dialog`, so gating/validation stay in jsdom). `ToggleGroup` chips remain jsdom-tested (status/severity filters).
- **localStorage stub:** Node 25's experimental WebStorage is unreliable under jsdom, so `tests/setup.ts` stubs a fresh in-memory `localStorage` per test (this also isolates the persisted mock role between tests).
- The **S2 role-scoping cases (H1/E1/E2/E3/E4)** are realized against the **`Sidebar`** (`Sidebar.test.tsx`), not a top nav — it asserts the matrix-correct nav per role (incl. *absence* of create/view-own for Agent/Lead/Admin).
- Forms use **RHF + `zodResolver`**; field errors are asserted via the rendered `FormMessage` (`role="alert"`). The `RadioGroup` (Radix) is driven by `userEvent.click` and works under the §1.1 polyfills.
- **Phase 3 (Helpdesk):** the 5 action dialogs use shadcn **`Dialog`** (opens in jsdom with the §1.1 polyfills), so dialog **gating + field validation** stay unit-tested (e.g. ForwardDialog preselect shows in the closed `Combobox` trigger; RedirectDialog reason validation). The agent/dept pickers were a native-`<select>` `SearchableSelect` driven by `selectOptions` — **superseded 2026-05-29** by the shadcn `Combobox`, so the pick→confirm→success/409 *flows* moved to Playwright (`helpdesk-actions.spec.ts`).
- Implemented suites: `status`, `severity`, `transitions`, `validation`, `rbac` (100-case grid), `api-client`, `errors`, `Sidebar`, `badges`, `Button`, `TicketForm` (S1), `TicketList`, `TicketDetail` (S10-H1 + S2-X2), `FileUpload`, `RelatedTickets`, **`AssignDialog` (S3), `ForwardDialog` (S4), `RedirectDialog` (S5), `CloseDialog` (S7), `HelpdeskTicketDetail` (S2/S3-X1/S7-X3 gating), `HelpdeskQueue`**, **`StaffQueue` (S6-E1 + access), `StaffTicketDetail` (S6-H1/S6-X1 gating), `ProgressButton` (S6-H1/S6-X2/409)**, and **`ticket-scoping`** (server-derived list scoping: Agent→assigned, DeptStaff→dept, Lead→all). Pending suites (S8, S9, S10-dashboard) land with Phases 5–6.
- **Phase 4 (Dept Staff):** `StaffTicketDetail` exposes only **Mark-In-Progress** (matrix: no Close/forward/redirect for DeptStaff) + comment; the `StaffQueue` is dept-scoped server-side and ships a **mobile-card + desktop-table** dual layout (tests scope assertions to the table to avoid the duplicated text). `POST /progress` has a DeptStaff dept-scope **403** backstop (S6-X2). **S6-E2** (comment-with-attachment in the timeline) is **deferred** — `CommentBox` is body-only and comments surface as `Commented` timeline events (§8 Q2 open).
- **Phase 5 (Admin):** `CategoryManager` (S8) — a **flat** category list (no parent/child): add + delete (confirm dialog warns the category is unset from any tickets gathering it); dup/short name → `422`/client field error (S8-X2). The console `AccessDenied`s for non-Admin (S8-X1). The category list `<ul>` carries `aria-label="Danh sách danh mục"` so tests scope to it. Inline rename/edit is deferred (mock `PATCH` exists for later). *(The former `RoutingManager` + its routing-rule tests were removed with the routing feature.)*
- **Phase 6 (Notifications + Dashboard):** `NotificationBell` (S9) — unread badge + a **plain-state toggle panel** (not a Radix `DropdownMenu`, so the open/list flow is jsdom-testable); S9-H1 (badge + newest-first), S9-E1 (empty → no badge). `NotificationList`/`NotificationItem` — S9-E2 (`DailyReminder` lists backlog tickets with severity + age), S9-X1 (failed mark-read keeps the item unread + retry). `Dashboard` (S10) — `canViewDashboard`-gated (S10-X2 SV, **S10-X3 Agent** both denied), counts/breakdowns (S10-E1), error+retry (S10-X1). Notification links route by role via `ticketDetailHref`.
- **Phase 7 (hardening):** `tests/unit/a11y.test.tsx` runs **`vitest-axe`** over 6 surfaces (TicketForm, TicketList, HelpdeskQueue, Dashboard, NotificationList, CategoryManager) → **0 violations** with `region`/`color-contrast` out of scope (need page landmarks/layout jsdom can't provide — a `@axe-core/playwright` page sweep would cover those). **e2e** (`tests/e2e/`): smoke + **S2-I1** (role-switch nav grid) + **S1-I1** (create → *Đã tiếp nhận*). Coverage **83% stmts / 81% branch** (≥ 80%). *Note:* `vitest-axe@0.1.0`'s matcher is broken (empty `extend-expect` + mistyped export) so the sweep asserts on `axe(...).violations` directly. **Still deferred (optional):** S9-X2, S9-I1, S10-I1, the S3–S8 dialog/admin `(e2e)` flows, a `@axe-core/playwright` per-page pass, and a 320px responsive audit.

---

## 2. Cross-cutting FE expectations (asserted across every story)

1. **Envelope / error map** (feature-plan §8): `401`→`/login` (preserve intended route) · `403`→`AccessDenied`/hide, no data leak · `404`→explicit not-found · `409`→toast "Hành động không còn hợp lệ. Đang làm mới…" + invalidate + close dialog · `422`→`form.setError` per field, form preserved · `5xx`→error state + retry.
2. **Four interaction states** on every list/detail/form: **loading** (`Skeleton`, `aria-busy`), **empty** (`EmptyState`), **error** (`role="alert"`), **success**. Every list/detail case implicitly checks loading→content.
3. **Role-gated controls** (per `role-permission-matrix.md`): a control the role can't perform is **never rendered** — assert absence, not just `disabled`.
4. **Status semantics**: requesters see **external** labels (Đã tiếp nhận / Đang xử lý / Hoàn tất); Helpdesk/Staff/Admin see the 5 internal labels.
5. **Severity three-channel**: color **+** emoji **+** label present (assert label/emoji, not color).
6. **Forms (RHF + Zod)**: invalid blocks submit with `FormMessage` + `aria-invalid`; **no API call** on client-invalid; `422` maps to the field.
7. **A11y**: each surface passes axe with 0 critical; dialogs trap focus and restore to opener; controls reachable by keyboard.

---

## 3. Test cases by Story

### S1 — Create ticket with severity + attachments  *(Requester & Dept Staff)*
- **H1** — GIVEN an authenticated SV on New Ticket, WHEN they enter valid title+description, pick `High`, attach 1 image, submit, THEN `POST /tickets` is sent and on `201` they see a success toast and land on *Yêu cầu của tôi* with the ticket shown as **Đã tiếp nhận**.
- **E1** — description at the 5000-char max → submit allowed, value sent untruncated.
- **E2** — a 6th file added (max 5) → rejected client-side with a clear VN message; first 5 remain.
- **E3** — category left empty (optional) → `categoryId` omitted; create still succeeds.
- **E4** — GIVEN role **DeptStaff** (matrix `canCreate` ✅), WHEN they open `/tickets/new`, THEN the form renders and a valid submit succeeds (Dept staff may file personal tickets).
- **X1** — title < 3 chars → RHF/Zod `FormMessage` shown, **no** API call.
- **X2** — valid form, API returns `422` (bad file type/size) → error maps to the attachment field via `form.setError`; entered values preserved.
- **I1** *(e2e)* — mock SSO as SV → create with attachment → land on *Yêu cầu của tôi* → ticket reads **Đã tiếp nhận**.

### S2 — SSO auth + RBAC + role-scoped UI  *(the permission matrix)*
- **H1** — role `SV` → only requester nav (Tạo yêu cầu · Yêu cầu của tôi · Bell); no Helpdesk/Admin entries.
- **E1** — role `HelpdeskAgent` → Hàng đợi visible; **Báo cáo/Dashboard absent** (matrix: Agent has no dashboard); Admin absent.
- **E2** — role `HelpdeskLead` → Hàng đợi **and** Báo cáo visible; Admin absent.
- **E3** — role `Admin` → Tất cả yêu cầu · Báo cáo · Danh mục · Người dùng; create-ticket nav absent.
- **E4** — role `DeptStaff` → Hàng đợi phòng ban + Bell (create reachable by URL/CTA, not a primary sidebar item).
- **X1** — `DeptStaff` deep-links `/admin/categories` → `AccessDenied` view (not a blank screen).
- **X2** — a requester opens another user's ticket URL → API `403` → "Bạn không có quyền xem yêu cầu này." and **no** ticket data rendered.
- **X3** — token expires mid-session; next call returns `401` → app routes to `/login` and preserves the intended destination.
- **I1** *(e2e)* — log in as each of the 5 role groups; assert the visible nav + reachable routes match the §4 RBAC grid.

### S3 — Helpdesk Lead assigns agent
- **H1** — GIVEN a Lead on a `Pending` ticket, WHEN they pick an agent in the Assign Combobox and confirm, THEN `POST /assign` is sent, the assignee shows, and **external status stays Đã tiếp nhận** (internal stays `Pending`).
- **E1** *(e2e / jsdom+polyfill)* — the Assign picker lists **only `HelpdeskAgent`** users and filters as you type.
- **E2** — an already-assigned ticket → reassigning shows the new assignee and a history `AgentAssigned` entry.
- **X1** — role `HelpdeskAgent` (not Lead) → the Assign control is **not rendered** (matrix `canAssign` = Lead only).
- **X2** — assign submit returns `409` (no longer Pending) → "Hành động không còn hợp lệ. Đang làm mới…" toast, detail invalidated, dialog closes, controls regate.
- **I1** *(e2e)* — Lead assigns → filtering the queue by that assignee shows the ticket.

### S4 — Forward to department
- **H1** — GIVEN a `Pending` ticket, WHEN Forward opens, THEN **no department is pre-selected** (routing rules were removed); the Agent/Lead picks a phòng ban and confirms → `POST /forward`, internal → `Assigned`, external stays **Đã tiếp nhận**.
- **E1** — opening Forward on any category → no preselect; the user must choose before confirm is enabled.
- **E2** *(e2e / jsdom+polyfill)* — long department list → the picker is searchable.
- **X1** — no department chosen → confirm disabled / validation shown; no API call.
- **X2** — forward returns `409` (already forwarded) → stale-state toast + refresh.
- **I1** *(e2e)* — create → assign → forward → ticket appears in the destination dept queue.

### S5 — Redirect with history
- **H1** — GIVEN an `Assigned`/`InProgress` ticket, WHEN Helpdesk redirects to another dept with a reason, THEN `POST /redirect` is sent, the timeline shows `from→to` + reason, external stays **Đã tiếp nhận**.
- **E1** — reason at min length (3 chars) → accepted.
- **E2** — multiple redirects → the timeline lists each in chronological order.
- **X1** — empty/short reason → RHF `FormMessage` blocks submit; **no** API call.
- **X2** — redirect returns `409` (ticket Closed) → "không thể chuyển hướng" + refresh.
- **I1** *(e2e)* — forward to wrong dept → redirect → new dept sees it; old dept no longer does.

### S6 — Department progress update  *(Dept Staff)*
- **H1** — GIVEN a `DeptStaff` on an `Assigned` ticket in their dept, WHEN they Mark In Progress, THEN `POST /progress` is sent and the requester view shows **Đang xử lý**.
- **E1** — dept queue with `status=open` → only that department's non-`Closed` tickets are listed.
- **E2** — a comment with an attachment (matrix: `canComment` ✅ for DeptStaff) → appears in the timeline with the file.
- **X1** — a `DeptStaff` → **no Close control** (matrix `canClose` excludes DeptStaff).
- **X2** — progress returns `403` (ticket not in their dept) → access-denied surfaced.
- **I1** *(e2e)* — staff marks In Progress → requester sees **Đang xử lý**.

### S7 — Helpdesk close + requester notification + no reopen
- **H1** — GIVEN a Lead **or the assigned Agent** on an `Assigned`/`InProgress` ticket, WHEN they Close (optional note), THEN `POST /close`; ticket → **Hoàn tất**; requester gets an in-app `TicketClosed` notification.
- **E1** — a `Closed` ticket viewed by the requester → shows **Hoàn tất**, is read-only, offers **no reopen** control.
- **E2** — optional resolution note on close → saved and shown in the timeline.
- **X1** — a `DeptStaff`/requester → **no Close control** (RBAC).
- **X2** — close returns `409` (already Closed) → "đã đóng" + refresh.
- **X3** — GIVEN a `HelpdeskAgent` who is **not** the assignee, THEN the Close control is **not shown** (ownership backstop, Brief §0.7 / feature-plan §11).
- **I1** *(e2e)* — Helpdesk closes → requester bell shows the close notice → ticket reads **Hoàn tất**.

### S8 — Admin category list (runtime, flat)
- **H1** — GIVEN an Admin, WHEN they add a category and save, THEN it appears in the flat list and becomes selectable on the requester create form.
- **E1** — deleting a category → confirm dialog warns it will be unset from any tickets gathering it (those revert to "chưa phân loại"); on confirm the category is removed from the list.
- **X1** — a non-Admin deep-links the Admin console → `AccessDenied` (RBAC).
- **X2** — category create with empty/duplicate name → client validation or mapped `422`; list unchanged.
- **I1** *(e2e)* — Admin adds a category → it appears on the requester create form.

### S9 — In-app notifications + daily reminder rendering
- **H1** — unread notifications → bell shows an unread count, list is newest-first, clicking one navigates to its ticket.
- **E1** — zero notifications → no badge + explicit empty state.
- **E2** — a `DAILY_REMINDER` listing N backlog tickets (severity + age) → rendered with severity color + `n` ngày. **Recipients per matrix = Agent / Lead / DeptStaff**; assert it renders for those roles and **not** for Requester/Admin.
- **X1** — mark-as-read fails → the item stays unread with a retry affordance.
- **X2** — a notification whose ticket now `403`s → graceful "Yêu cầu không còn khả dụng" (no crash).
- **I1** *(e2e)* — receive a close notification → bell increments → click → detail → mark read → badge decrements.

### S10 — Audit timeline + module dashboard
- **H1** — ticket detail timeline renders all `TicketEvent`s (created/assigned/forwarded/started/redirected/severity-changed/closed) in chronological order with actor + timestamp.
- **E1** — dashboard (Lead/Admin) → counts by severity/category/status render; empty data → zero-states.
- **E2** — a ticket with many events → the timeline scrolls without layout break.
- **X1** — dashboard API errors → error state with retry (not a blank page).
- **X2** — a requester deep-links `/analytics` → `AccessDenied` (RBAC).
- **X3** — a `HelpdeskAgent` deep-links `/analytics` → `AccessDenied` (matrix: Agent has **no** dashboard — distinct from Lead).
- **I1** *(e2e)* — open dashboard as Lead → see counts → drill into a ticket → timeline matches.

### S11 — Demo login / logout + route guard

- **H1** — GIVEN the credential note picked persona "u-sv-1", WHEN the user types the shown credentials and submits, THEN `POST /auth/login` is called with `credentials: 'include'`; the `authKeys.me` cache is populated; `router.push(homeRouteFor('SV'))` (= `/tickets/new`).
- **H2** — GIVEN a logged-in user, WHEN they click `Đăng xuất` (top bar **or** sidebar footer), THEN `POST /auth/logout` runs, `queryClient.clear()` fires, the `authKeys.me` cache is invalidated, and the router pushes to `/login`.
- **E1** — The credential-helper modal's role tablist each list the matching personas; clicking a persona reveals its credentials inline and auto-fills the `Email` field (seeded personas also fill the password; admin-created ones don't).
- **E2** — The modal is dismissible (X button or backdrop click) and re-opens via the login-page button (no localStorage persistence of dismissal).
- **E3** — Logging in on `/login?next=%2Fanalytics` lands on `/analytics` (when the role is allowed there) or falls back to `homeRouteFor(role)` (when the role isn't, e.g. SV redirected from `/analytics`).
- **X1** — Wrong password → BE `401` with field-agnostic error → form shows "Sai tài khoản hoặc mật khẩu"; the form values stay intact (no field-level error mapping).
- **X2** — Logged-out user deep-links `/tickets/new` → AuthGate redirects to `/login?next=%2Ftickets%2Fnew`; after login they land on `/tickets/new`.
- **X3** — Logged-in user navigates to `/login` → AuthGate immediately redirects to `homeRouteFor(role)` (no flash of the form).
- **I1** *(e2e)* — full happy path on each role: open `/`, click **Bắt đầu**, splash → login page, pick a persona from the note, log in, land on the role's home, click `Đăng xuất` → back to `/login`.

### S14 — Admin user directory (read-only)  *(new, 2026-06-09)*
- **X1** — a non-Admin role on `/admin/users` → `AccessDenied` (matrix gate).
- **H1** — Admin sees the table with seeded personas; no PII columns (`passwordHash`/`googleId`) anywhere.
- **H2** — typing in the filter-drawer search narrows the visible rows.
- **E1** — a no-match search renders the EmptyState copy.
- **X2/H3/X3** — `UserDetail`: non-Admin AccessDenied / Admin sees the record / unknown id → "Không tìm thấy người dùng".

### S15 — Admin user create  *(scope exception, 2026-06-09)*
- **H1** — Admin fills the form → `POST /users` succeeds → navigates to the new detail page. **H2** — blank password still creates (SSO-only). **H3** — directory shows the **Tạo người dùng** trigger → `/admin/users/new`.
- **X1** — duplicate (active) email → inline email error, no navigate. **X2** — short password → field error. **X3** — name with digits → field error. **X4** — Vietnamese diacritics accepted. **X5** — personal email (gmail) → email error. **X6** — Phòng ban field hidden for the default SV role.
- **S5–S8** *(credential helper)* — created persona appears on its role tab; scoped to that tab; reveal shows no password (identity only); v1 stored password is scrubbed on read.

### S16 — Admin user edit + soft delete  *(scope exception, 2026-06-10)*
- **X1** — non-Admin on the edit page → AccessDenied. **H1** — Admin edits displayName → PATCH → nav to detail. **X2** — no-change save short-circuits (no PATCH). **X3/X5** — short password / name digits → field errors.
- **H2** — Admin sees **Cập nhật** + **Xóa** for another user. **X4** — **Xóa** disabled when viewing self. **H3** — confirm → DELETE → nav to list. **H4** — a soft-deleted user is excluded from `listUsers()`. **H5** — re-creating a deleted user's email revives the same row (no 409).
- **Ghost-user** (`ApiClient` cases) — a 401 from a non-`/auth/*` endpoint fires `m31:session-expired`; `/auth/me` + `/auth/login` 401 and any 403 do not.

### S17 — DeptStaff close request workflow  *(new, 2026-06-11)*
- **H1** — `RequestCloseDialog`: a note → POST `/request-close` with the note + success toast. **E1** — an empty note → inline error, no request.
- **H2** — `ReviewCloseDialog`: approve → POST `/approve-close` + toast. **H3** — refuse with a reason → POST `/refuse-close` carrying the reason. **E2** — refuse with no reason → inline error, no request.
- **G1** — DeptStaff (routed dept) on `InProgress` sees "Yêu cầu đóng"; **G2** — hidden before In Progress; **G3** — `CloseRequested` shows the "chờ Helpdesk duyệt" banner.
- **G4** — Lead on `CloseRequested` sees "Duyệt đóng" + "Từ chối" (direct-close hidden in this paused state); **G5** — the assigned Agent sees them; **G6** — a non-assignee Agent does not.

### S18 — Agent/Lead direct redirect  *(new, 2026-06-11)*
- **G1** — `RedirectDialog` opens with no dept preselected + confirm disabled. **H1** — `redirectTicket` API sends `departmentId` + `reason`. **E1** — a 422 (same dept) surfaces as `ApiError`.
- **G1** — a Lead on an `Assigned` ticket sees "Chuyển phòng khác"; **G2** — hidden on `Pending` (use Forward).

### S19 — DeptStaff redirect request workflow  *(new, 2026-06-11)*
- **H1** — `RequestRedirectDialog`: reason → POST `/request-redirect`. **E1** — empty reason → inline error, no request.
- **H3** — `ReviewRedirectDialog`: refuse with a reason → POST `/refuse-redirect`. **E2** — refuse with no reason → error. **G5** — Approve dialog confirm disabled until a dept is picked. **H2** — `approveRedirect` API sends `departmentId` + `note`.
- **G1** — DeptStaff on `Assigned` sees "Xin chuyển phòng ban"; **G2** — `RedirectRequested` shows the "chờ duyệt" banner. **G3** — Lead on `RedirectRequested` sees "Duyệt chuyển" + "Từ chối"; **G4** — a non-assignee Agent does not.

### S20 — Google SSO login + login rate-limit  *(2026-06)*
- **G1** — `GoogleLoginButton` renders "Đăng nhập bằng Google" on `/login`; clicking it does a **full-page navigation** to the BE `/auth/google` (asserted via the `window.location` href, not a `fetch`).
- **X1** — `POST /auth/login` returns **`429`** (too many attempts) → the form surfaces the rate-limit message (distinct from the field-agnostic `401` "Sai email hoặc mật khẩu"); values preserved, no retry storm.

### S21 — Helpdesk re-categorize  *(2026-06)*
- **G1** — `CategoryAssignDialog` ("Phân loại") is rendered for Agent + Lead (`canCategorize`) and **absent** for DeptStaff/requester/Admin.
- **H1** — pick a category → `PATCH /tickets/:id/category` sends the new `categoryId`; success toast "Đã cập nhật danh mục."
- **H2** — pick "— Không phân loại —" → sends `categoryId: null`; toast "Đã bỏ phân loại."
- **E1** — confirm with the unchanged category → dialog closes with **no** API call.
- **X1** — `409` → stale-state handling (invalidate + close); `422` on `categoryId` → error toast.

### S22 — Notification bulk actions  *(2026-06)*
- **H1** — `MarkAllReadButton` → `POST /notifications/read-all` → all rows read + badge clears.
- **H2** — `ClearAllButton` → `DELETE /notifications` → list empties to the EmptyState.
- **E1** — bulk actions are hidden/disabled when there's nothing to act on.

### S23 — Attachment lightbox + preview fallback  *(2026-06)*
- **H1** — an **image** attachment opens in an **in-page lightbox** (`Dialog`) served via the auth'd `/attachments/:id` proxy; no navigation away from the ticket. A **PDF** opens in a **new tab** (`target="_blank"`); other types **download**.
- **X1** — the proxied image fails to load → `onError` swaps to a graceful "Không tải được hình ảnh." state (no broken-image icon); the "Tải xuống" link still works.

---

## 4. RBAC visibility grid (S2 expansion — derived from `role-permission-matrix.md`)

Each cell is an assertion: **✅ control/route present & usable**, **🚫 control absent / route → `AccessDenied`**.

| Surface / control | SV/GV/NV | Agent | Lead | DeptStaff | Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Nav: Tạo yêu cầu / Yêu cầu của tôi | ✅ | 🚫 | 🚫 | ✅* | 🚫 |
| Nav: Hàng đợi (all tickets) | 🚫 | ✅ | ✅ | 🚫 | ✅ |
| Nav: Hàng đợi phòng ban | 🚫 | 🚫 | 🚫 | ✅ | ✅ |
| Nav: Báo cáo (dashboard) | 🚫 | **🚫** | ✅ | 🚫 | ✅ |
| Nav: Danh mục / Người dùng | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Control: Assign agent | 🚫 | 🚫 | ✅ | 🚫 | 🚫 |
| Control: Forward / Redirect / Override severity | 🚫 | ✅ | ✅ | 🚫 | 🚫 |
| Control: Re-categorize (Phân loại) | 🚫 | ✅ | ✅ | 🚫 | 🚫 |
| Control: Mark In Progress | 🚫 | ✅ | ✅ | ✅ | 🚫 |
| Control: Close | 🚫 | ✅† | ✅ | 🚫 | 🚫 |
| Control: Comment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily reminder received | 🚫 | ✅ | ✅ | ✅ | 🚫 |

\* DeptStaff create is capability-✅ but not a primary sidebar entry (reachable by URL/CTA). † Agent Close additionally requires being the **assignee** (ownership backstop) — see S7-X3.

This grid is realized as a **parametrized test** (one row per role) at the unit level for control visibility, and one Playwright `(e2e)` sweep for nav/route reachability (S2-I1).

---

## 5. Coverage matrix (min-count compliance)

| Story | Happy | Edge | Error | Integration | Meets min |
|---|:--:|:--:|:--:|:--:|:--:|
| S1 | 1 | 4 | 2 | 1 | ✅ |
| S2 | 1 | 4 | 3 | 1 | ✅ |
| S3 | 1 | 2 | 2 | 1 | ✅ |
| S4 | 1 | 2 | 2 | 1 | ✅ |
| S5 | 1 | 2 | 2 | 1 | ✅ |
| S6 | 1 | 2 | 2 | 1 | ✅ |
| S7 | 1 | 2 | 3 | 1 | ✅ |
| S8 | 1 | 2 | 2 | 1 | ✅ |
| S9 | 1 | 2 | 2 | 1 | ✅ |
| S10 | 1 | 2 | 3 | 1 | ✅ |
| S11 | 2 | 3 | 3 | 1 | ✅ |
| S14 | 2 | 1 | 3 | — | ✅ |
| S15 | 3 | 1 | 6 | — | ✅ |
| S16 | 4 | 1 | 4 | — | ✅ |
| S17 | 5 | — | 6 | — | ✅ |
| S18 | 2 | — | 3 | — | ✅ |
| S19 | 4 | — | 6 | — | ✅ |
| S20 | 1 | — | 1 | — | ✅ |
| S21 | 2 | 1 | 1 | — | ✅ |
| S22 | 2 | 1 | — | — | ✅ |
| S23 | 1 | — | 1 | — | ✅ |

**Totals (v1, S1…S11):** 12 Happy · 27 Edge · 26 Error · 11 Integration = **76 FE test cases**.
**User-management + close/redirect additions (S14…S19, 2026-06):** ~60 more cases (6 S14 + 10 S15 + 10 S16 + 11 S17 + 5 S18 + 10 S19 + credential-helper/ghost-user), in the same Vitest suite.
**Recently shipped additions (S20…S23, 2026-06):** Google SSO + rate-limit, re-categorize, notification bulk actions, attachment lightbox/preview-fallback. Full FE suite green at the latest sync (**256 Vitest tests across 43 files**, + Playwright e2e).

---

## 6. Accessibility test plan

| Check | How | Where |
|---|---|---|
| 0 critical violations per surface | `vitest-axe` on each component; `@axe-core/playwright` per page | all |
| Dialog focus trap + restore-to-opener | drive open→ESC/close, assert focus | Playwright (Radix Dialog) |
| Keyboard reach for Combobox/Select/DropdownMenu | `userEvent.keyboard` arrows/enter | Playwright (Radix) |
| Form errors announced | assert `role="alert"` + `aria-invalid` on invalid submit | Vitest |
| Severity not color-only | assert emoji + text label present | Vitest |
| Status pills contrast ≥ 4.5:1 | axe color-contrast rule | both |

---

## 7. Test data & MSW fixtures

- **Roles**: one mock identity per role (SV, GV, NV, HelpdeskAgent, HelpdeskLead, DeptStaff, Admin); `renderWithProviders({ role })` selects the active identity (e2e logs in via `POST /auth/login`).
- **Tickets**: at least one fixture in each internal state (`Pending`, `Assigned`, `InProgress`, `CloseRequested`, `RedirectRequested`, `Closed`) so transition/RBAC cases have a valid starting point. *(The transient `Redirected` state was dropped — re-routing now lands back in `Assigned`.)*
- **Catalog**: departments, agents, categories (incl. **"Khác"**). Forward no longer pre-selects a department — routing rules were removed.
- **Notifications**: a `TicketClosed`, a `DailyReminder` with ≥2 backlog tickets, and an unread/read mix.
- **Error fixtures**: per endpoint, an override returning 401/403/404/409/422/5xx for the X-cases (via `server.use(...)` per test, matching the existing MSW override pattern).
- Fixtures are **deterministic** (fixed ids/timestamps) so list ordering and timeline assertions are stable.

---

## 8. Open testing questions

1. **DeptStaff "Tạo yêu cầu" entry point** — matrix grants the capability but omits it from the sidebar (S1-E4 / S2-E4). Confirm the entry point (URL-only vs queue-header CTA) so the e2e knows where to click.
2. **Comment on `Closed` tickets** — feature-plan §11 leaves the status guard TBD (default: allowed). If Closed is fully read-only, add S7 edge cases (comment blocked) and adjust S6-E2.
3. **Reminder backlog set per role** — S9-E2 assumes Agent = assigned tickets, Lead = un-assigned/un-forwarded, DeptStaff = dept open tickets. Confirm the per-role backlog definition before asserting counts.
4. **Radix-in-jsdom budget** — confirm we accept moving Select/Combobox/DropdownMenu *interaction* assertions to Playwright (§1.1), keeping Vitest for logic + visibility. (Recommended.)

---

*Traceability: ISO M31 v1.1 → Brief → Feature Plan (§17 AC, App. A contract) + Role-Permission Matrix → these FE test cases (`M31-FE-S*`). Next per process: **Step 5 — `/sc:workflow --detail`** (implementation plan), then `/sc:implement` writing these cases against real components as each surface is built.*
