# Role Permission Matrix — M31 Helpdesk / Ticket

> Source of truth for RBAC implementation.
> Use this to determine which UI controls to render/hide per role.
> A role that cannot perform an action must **never** see the control — not even disabled.
>
> **Implemented verbatim in `lib/auth/rbac.ts`** and locked by the 100-case grid in `tests/unit/rbac.test.ts`. Role ids: `SV | GV | NV | HelpdeskAgent | HelpdeskLead | DeptStaff | Admin`. The sidebar (`lib/auth/nav.ts` → `navSectionsFor`) is gated by these predicates.

> **All entries are conditional on authentication.** Every row below assumes the user has logged in via `POST /auth/login` and holds a valid JWT session cookie. Logged-out visitors hit the route guard (`auth/auth-gate.tsx` — Feature Plan §11.5) and get redirected to `/login` before any of these predicates run. No role has anonymous access to any surface beyond `/` (landing) and `/login` itself.

## Matrix

| Chức năng | SV/GV/NV | Helpdesk Agent | Helpdesk Lead | Dept Staff | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Tạo ticket mới | ✅ | ❌ | ❌ | ✅ | ❌ |
| Xem ticket của mình | ✅ | ❌ | ❌ | ✅ | ❌ |
| Comment trên ticket | ✅ | ✅ | ✅ | ✅ | ✅ |
| Truy cập hàng đợi ticket | ❌ | ✅¹ | ✅ | ❌ | ✅ |
| Xem ticket của dept mình | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign ticket cho Agent | ❌ | ❌ | ✅ | ❌ | ❌ |
| Forward đến phòng ban (Pending→Assigned) | ❌ | ✅ | ✅ | ❌ | ❌ |
| Redirect sang phòng khác (trực tiếp) | ❌ | ✅² | ✅ | ❌ | ❌ |
| Xin chuyển phòng ban (kèm lý do) | ❌ | ❌ | ❌ | ✅³ | ❌ |
| Duyệt / Từ chối yêu cầu chuyển | ❌ | ✅² | ✅ | ❌ | ❌ |
| Override severity | ❌ | ✅ | ✅ | ❌ | ❌ |
| Cập nhật In Progress | ❌ | ✅ | ✅ | ✅ | ❌ |
| Đóng ticket (trực tiếp) | ❌ | ✅² | ✅ | ❌ | ❌ |
| Yêu cầu đóng (kèm minh chứng) | ❌ | ❌ | ❌ | ✅³ | ❌ |
| Duyệt / Từ chối yêu cầu đóng | ❌ | ✅² | ✅ | ❌ | ❌ |
| Dashboard tổng quan | ❌ | ❌ | ✅ | ❌ | ✅ |
| Quản lý Category tree | ❌ | ❌ | ❌ | ❌ | ✅ |
| Quản lý Routing rules | ❌ | ❌ | ❌ | ❌ | ✅ |
| Xem danh sách người dùng | ❌ | ❌ | ❌ | ❌ | ✅ |
| Tạo người dùng | ❌ | ❌ | ❌ | ❌ | ✅* |
| Cập nhật người dùng (PATCH) | ❌ | ❌ | ❌ | ❌ | ✅* |
| Xóa (vô hiệu hóa) người dùng | ❌ | ❌ | ❌ | ❌ | ✅* |
| Daily reminder | ❌ | ✅ | ✅ | ✅ | ❌ |

> \* **Scope exceptions:** user lifecycle (create/update/delete) normally lives in M1 (IAM). The helpdesk module exposes `POST /users`, `PATCH /users/:id`, and `DELETE /users/:id` (soft — `isActive=false`) for the practice/demo flow only, per explicit product decisions (2026-06-09 for create, 2026-06-10 for update + delete). Email is intentionally immutable here. Admin cannot delete themselves (BE 409). Read-only fetch (`GET /users`, `GET /users/:id`) is the long-term contract.

> ¹ **Helpdesk Agent chỉ thấy ticket được gán cho mình** trong hàng đợi (server-derived scoping); mở ticket của agent khác → **403**. Chỉ **Lead** và **Admin** thấy tất cả ticket. Agent vẫn truy cập màn hình hàng đợi (`canViewQueue` = true), nhưng dữ liệu bị giới hạn theo `helpdeskAssigneeId = caller.id`.
>
> ² **Ownership backstop:** một **Agent** chỉ đóng / duyệt / từ chối ticket **được gán cho mình**; **Lead** thao tác trên mọi ticket.
>
> ³ **Close request (S17, 2026-06-11):** DeptStaff của **phòng được phân công** gửi yêu cầu đóng kèm **comment bắt buộc + ảnh tuỳ chọn** khi ticket đang `InProgress`. Ticket chuyển sang `CloseRequested` (người yêu cầu vẫn thấy "Đang xử lý"). Agent/Lead phụ trách **Duyệt** (→ Closed) hoặc **Từ chối** (kèm lý do → InProgress để làm lại). Mọi bước (yêu cầu / duyệt / từ chối) gửi notification cho bên liên quan. Đóng trực tiếp (không qua yêu cầu) vẫn dành cho Agent/Lead như cũ.
>
> **Redirect (S18/S19, 2026-06-11):** **Trực tiếp (S18)** — Agent/Lead chuyển ticket `Assigned`/`InProgress` sang phòng ban khác (kèm lý do); ticket reset về `Assigned` cho phòng mới, giữ nguyên agent phụ trách. **Yêu cầu (S19)** — DeptStaff của phòng đang xử lý gửi **yêu cầu chuyển kèm lý do** (không chọn phòng đích); ticket sang `RedirectRequested`; Agent/Lead phụ trách **Duyệt** (tự chọn phòng đích → Assigned) hoặc **Từ chối** (kèm lý do → trạng thái trước đó). Mọi bước gửi notification.

## Role definitions

| Role | Mô tả |
|---|---|
| **SV/GV/NV** | Sinh viên, Giảng viên, Nhân viên — người tạo và theo dõi ticket của mình |
| **Helpdesk Agent** | Nhân viên Helpdesk — xử lý **các ticket được gán cho mình**; forward, redirect, đóng ticket |
| **Helpdesk Lead** | Trưởng Helpdesk — toàn quyền của Agent + assign ticket cho Agent + xem Dashboard |
| **Dept Staff** | Nhân viên phòng ban — xem và xử lý ticket được gán cho phòng ban mình |
| **Admin** | Admin hệ thống — xem tất cả ticket + quản lý category tree & routing rules |

## Sidebar navigation per role

### SV / GV / NV
- Tạo ticket mới
- Ticket của tôi

### Helpdesk Agent
- Hàng đợi (Queue) — tất cả ticket
- Thông báo (daily reminder)

### Helpdesk Lead
- Dashboard
- Hàng đợi (Queue) — tất cả ticket
- Thông báo (daily reminder)

### Dept Staff
- Queue phòng ban — ticket được gán cho dept
- Thông báo (daily reminder)

### Admin
- Dashboard
- Tất cả ticket
- Quản lý Danh mục (Category tree)
- Quản lý Routing rules
- Người dùng (read-only directory)

## Implementation notes

- `canCreate(role)` → `['SV', 'GV', 'NV', 'DeptStaff'].includes(role)`
- `canViewOwn(role)` → `['SV', 'GV', 'NV', 'DeptStaff'].includes(role)`
- `canViewQueue(role)` → `['HelpdeskAgent', 'HelpdeskLead', 'Admin'].includes(role)`
- `canViewDeptQueue(role)` → `['DeptStaff', 'Admin'].includes(role)`
- `canAssign(role)` → `role === 'HelpdeskLead'`
- `canForward(role)` → `['HelpdeskAgent', 'HelpdeskLead'].includes(role)`
- `canRedirect(role)` → `['HelpdeskAgent', 'HelpdeskLead'].includes(role)`
- `canOverrideSeverity(role)` → `['HelpdeskAgent', 'HelpdeskLead'].includes(role)`
- `canUpdateProgress(role)` → `['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'].includes(role)`
- `canClose(role)` → `['HelpdeskAgent', 'HelpdeskLead'].includes(role)`
- `canRequestClose(role)` → `role === 'DeptStaff'`; `canRequestCloseTicket(role, deptId, ticket)` adds the routed-dept match *(S17)*
- `canReviewCloseRequest(role, userId, ticket)` → same ownership rule as `canCloseTicket` (Lead any; Agent only their assigned) *(S17)*
- `canRedirect(role)` → `['HelpdeskAgent','HelpdeskLead']`; `canRedirectTicket(role, userId, ticket)` adds the close-style ownership *(S18)*
- `canRequestRedirect(role)` → `role === 'DeptStaff'`; `canRequestRedirectTicket(role, deptId, ticket)` adds the routed-dept match *(S19)*
- `canReviewRedirectRequest(role, userId, ticket)` → same ownership as `canRedirectTicket` *(S19)*
- `canViewDashboard(role)` → `['HelpdeskLead', 'Admin'].includes(role)`
- `canManageCategories(role)` → `role === 'Admin'`
- `canManageRouting(role)` → `role === 'Admin'`
- `canViewUsers(role)` → `role === 'Admin'` *(read-only fetch; departments + faculties are owned by other UMS modules)*
- `canCreateUsers(role)` → `role === 'Admin'` *(scope exception — see note above the matrix)*
- `canUpdateUsers(role)` → `role === 'Admin'` *(scope exception 2026-06-10 — email immutable; password reset supported)*
- `canDeleteUsers(role)` → `role === 'Admin'` *(scope exception 2026-06-10 — soft delete; self-target blocked at BE 409)*
- `receivesDailyReminder(role)` → `['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'].includes(role)`

## Traceability

- ISO: `ISO_M31_Helpdesk_Ticket_v1.1.docx`
- Brief: `docs/brief.md` §3 Target users & roles
- Feature Plan: `docs/feature-plan.md` §3 (personas) + §11 (RBAC × state-machine guards)
- Implementation Plan: `docs/impl-plans/feat-M31-helpdesk-fe.md`
- Code: `lib/auth/rbac.ts` (predicates) · `lib/auth/nav.ts` (sidebar) · `tests/unit/rbac.test.ts` (grid)
- UI Design: `docs/ui-design/helpdesk-console.html`
