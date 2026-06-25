# M31 Helpdesk / Ticket — Front-end

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui front-end for the **M31 Helpdesk/Ticket** module. It codes against the M31 API contract (`docs/feature-plan.md` Appendix A). The app talks to the deployed BE on Vercel (`https://ums-helpdesk-api.vercel.app`); MSW is on only inside the Vitest suite.

## Design docs

- `docs/architecture.md` — **Codebase map + tech guide** (what file/tech does what; living doc)
- `docs/brief.md` — Brief (problem & goals)
- `docs/feature-plan.md` — FE Feature Plan (UI/UX-first; design system, IA, App. A mock contract)
- `docs/role-permission-matrix.md` — RBAC source of truth (per-role capability grid)
- `docs/ui-design/helpdesk-console.html` — UI design reference (sidebar console)
- `docs/test-design.md` — FE test design (Given/When/Then per story)
- `docs/impl-plans/feat-M31-helpdesk-fe.md` — implementation plan (phases + status)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm test` / `coverage` | Vitest unit + component tests / with coverage |
| `npm run test:e2e` | Playwright e2e (run `npx playwright install` once) |

## Status

**Phases 0–6 done** (2026-05-29) — all six feature surfaces built: scaffold + shadcn/ui, shared foundation (types · API client · MSW state machine · RBAC from the matrix · status/severity), the **Requester UI** (create / list / detail), the **Helpdesk console** (queue + detail + assign / forward / redirect / override-severity / close dialogs), the **Dept Staff view** (dept-scoped queue + detail + Mark-In-Progress + comment), the **Admin console** (category tree), and **Notifications + Dashboard** (header bell with unread badge + full list + daily-reminder rendering; Lead/Admin analytics dashboard) — on a **responsive sidebar shell + top bar** with a red brand accent. Helpdesk Agents are scoped to their **assigned** tickets.

**Phase 7 (hardening) done** — a `vitest-axe` a11y sweep (0 violations across 6 surfaces), Playwright e2e (role-nav + create flow), and coverage **83% stmts / 81% branch** (≥ 80% gate). The UI is **fully shadcn/ui** — every dropdown/picker/menu is `Select`/`ToggleGroup`/`Combobox`/`DropdownMenu` (no native form controls); since Radix dropdowns don't open in jsdom, their interactions are covered by Playwright while Vitest keeps logic + visibility.

**Phase 8 (demo login/logout) done** (2026-06-05) — real session lifecycle on top of the shipped surfaces. The mock role-switcher is removed; identity comes from the JWT cookie returned by `POST /auth/login` on the deployed BE. New: `/login` page with a 2-column layout (brand panel + login card), a credential-helper modal that auto-fills email + password for each seeded persona, **Google SSO login** ("Đăng nhập bằng Google" → BE-mediated OAuth) with login rate-limit (`429`) handling, password reveal toggle with animated Eye/EyeOff icon, logout buttons in both top bar and sidebar footer (hard-navigates to `/login` after `queryClient.clear()`), and an `AuthGate` that redirects anonymous callers to `/login?next=...` and bounces logged-in users away from `/login`. A global "© 2026 CAIRA-DAU. All rights reserved." strip is fixed at the bottom of every page.

**Admin user-management console (S14–S16) done** — `/admin/users` directory (paged + filterable list + per-user detail) plus **create** (`/admin/users/new`), **edit** (`/admin/users/[id]/edit`, email immutable), and **soft delete** (deactivate; no self-delete). Scope exceptions per product decision; institutional-email + letters-only-name validation.

**Close / redirect workflows (S17–S19) done** — DeptStaff **Yêu cầu đóng** (proof) + Agent/Lead **Duyệt / Từ chối**; Agent/Lead **direct redirect** to another dept; DeptStaff **Xin chuyển phòng ban** + Agent/Lead **Duyệt chuyển / Từ chối**. The Admin console is **category-only** (routing rules were removed for being too rigid for cross-domain tickets). New internal statuses `CloseRequested` / `RedirectRequested`.

Also shipped: a **realtime / Socket.IO layer** (`SocketProvider`) that turns server events into TanStack Query cache invalidations (live notification bell + queue/detail/dashboard refresh), Helpdesk **re-categorize** of a ticket, and notification **mark-all-read** + **clear-all**. **256 Vitest tests** across 43 files (+ Playwright e2e), `tsc`/lint/build clean.

**Environment setup:** copy `.env.example` → `.env.local` and set the four `NEXT_PUBLIC_*` vars — `NEXT_PUBLIC_API_BASE_URL` (BE base, or `/api/v1` for mock mode), `NEXT_PUBLIC_HELPDESK_ENABLED`, `NEXT_PUBLIC_USE_MOCKS` (`true` = MSW intercepts; `false` = real BE), and `NEXT_PUBLIC_REALTIME_URL` (Socket.IO server; leave unset to disable realtime). Requires **Node 22** (see `.nvmrc` / `.node-version`).

Optional follow-ups: a 320px responsive audit and the remaining `(e2e)` flows (S3–S8 dialogs/admin, S9-X2, S9-I1/S10-I1).
