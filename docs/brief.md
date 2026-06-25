# Brief — M31 Helpdesk / Ticket

| Field | Value |
|---|---|
| Module | **M31 — Helpdesk / Ticket** |
| Nhóm | I — Hạ tầng & Trí tuệ |
| Source ISO | `DAU-ISO/ISO_M31_Helpdesk_Ticket_v1.0.docx` — ISO v1.1 (Draft, 27/05/2026) |
| Roadmap | Phase 1 (2026); CAIRA chủ trì kỹ thuật (no separate business workshop) |
| Brief status | Draft — pending resolution of Open Questions before publish |
| Author | CAIRA-DAU Dev (brainstorm w/ SuperClaude) |
| Language | English narrative; Vietnamese domain terms verbatim |
| Tier | Tier 2 (Brief) of the CAIRA-DAU document hierarchy → next: Feature Plan |

> This Brief distils the *problem and goals* from ISO M31. It is **not** a copy of the ISO and contains **no** architecture/API/schema decisions (those belong to the Feature Plan, Step 3).

---

## 1. Problem statement

When a student (SV), lecturer (GV), or staff member (NV) hits a problem — whether a **digital incident** (UMS, LMS, email, Wi-Fi) or a **physical incident** on campus (điện, nước, điều hoà, thiết bị phòng học) — there is today **no unified intake channel**. Requests arrive through personal email, Zalo, or face-to-face, which causes four concrete failures: (1) the same issue is reported to several people, producing **duplicate or dropped** handling; (2) there is **no traceability** — once resolved, nothing is recorded for root-cause analysis or performance review; (3) the requester **cannot see where their request stands**; and (4) BGH has **no school-wide view** of operational hotspots.

M31 introduces a single, SSO-gated Helpdesk that is the **central hub** for the full ticket lifecycle — receive, classify, route, and close — covering both digital and physical incidents in one place.

## 2. Objectives

1. **One intake for the whole school**, covering digital *and* physical incidents, reached via SSO from within Cổng SV (M20) and Cổng GV (M21).
2. **Helpdesk-centric lifecycle**: every ticket is received, classified, routed, and closed under Helpdesk control — Helpdesk is the *only* role that closes a ticket.
3. **Real-time status for requesters** through three clear external states: **Requested → Processing → Finished**.
4. **No dropped tickets**: each working day at **09:00**, the assigned Helpdesk agent gets an in-app reminder listing their outstanding (tồn đọng) tickets.
5. **Operational insight for BGH/Admin**: ticket data (count, severity, category, handling time) flows to the M3 data lake to surface hotspots.

## 3. Target users & roles

All users **must** authenticate before reaching the app. For the shareholder-demo build this is an **email + password** login against seeded mock identities (see §5); real M1 SSO replaces it for production. No registration, no anonymous access, no reset flow.

| Role | Primary capability |
|---|---|
| **Sinh viên (SV)** | Create ticket, choose severity, track status |
| **Giảng viên (GV)** | Create ticket, choose severity, track status |
| **Nhân viên (NV)** | Create ticket, choose severity, track status |
| **Helpdesk Lead** *(refinement, see §6)* | Assign incoming tickets to Helpdesk agents; redirect; close |
| **Helpdesk Agent** | Handle assigned tickets, forward to phòng ban, follow up, close |
| **Phòng ban (Staff)** | View assigned tickets, update progress (→ Processing), report back to Helpdesk |
| **Admin** | Manage the category list at runtime (no code release) |
| **BGH / Admin (oversight)** | Read aggregate analytics / hotspots |

## 4. Success criteria

- **Adoption:** 100% of in-school support requests flow through Helpdesk within **4 weeks** of go-live.
- **Routing quality:** first-time-correct routing to the right phòng ban **≥ 85%** after the first month.
- **No loss:** **zero** tickets without a status or owner once the system is stable.
- **Backlog control:** share of tickets outstanding **> 3 days is < 10%** after the first month (reminder effectiveness).

## 5. Scope

### In scope
- Create & manage support tickets for both digital and physical incidents.
- **Mandatory severity** on creation — **Critical 🔴 / High 🟠 / Medium 🟡 / Low 🟢**; Helpdesk may override a mis-declared severity.
- **Attachments: images + documents** on both ticket creation and comments.
- **Helpdesk Lead assigns** each incoming ticket to a Helpdesk agent (ownership for the reminder).
- Helpdesk receives → routes to the relevant phòng ban; can **redirect** a mis-routed ticket any time before close, with each redirect written to ticket history.
- **Helpdesk is the only role that closes** a ticket (Staff and users cannot). Phòng ban staff may **request** a close (with proof) or **request** a redirect to another department; the owning Helpdesk Agent/Lead approves or refuses.
- **3 external statuses** for users (Requested/Processing/Finished) over **6 internal statuses** (Pending/Assigned/In Progress/CloseRequested/RedirectRequested/Closed). *(The transient `Redirected` state was dropped — a redirect now lands back in `Assigned`.)*
- **In-app notifications only**: close-notification to the requester + the daily 09:00 backlog reminder to the assigned Helpdesk agent.
- **Admin-managed** category list (flat — no parent/child), editable at runtime without a code release. *(Configurable routing rules were dropped — too rigid for cross-domain tickets; Helpdesk routes/forwards each ticket manually.)*
- **SSO/IAM** authentication with role-appropriate UI.
- **Embedded** in Cổng SV (M20) and Cổng GV (M21) so users never leave the portal.
- **Analytics push** of ticket data to the M3 data lake for BI dashboards.
- **Demo login / logout** — `/login` route with an **email + password** form. The page offers an on-demand credential-helper modal that introduces the build, lists every mock role in tabs, and reveals the credentials for whichever persona the reviewer picks. The previous "role-switcher dropdown" in the sidebar is removed; `Đăng xuất` lives in both the top bar and the sidebar footer.
- **Google SSO login** *(2026-06)* — "Đăng nhập bằng Google" on `/login`; BE-mediated Authorization Code Flow; `@ums.edu.vn`/`@dau.edu.vn` only; a deactivated account is blocked with a clear message.
- **Admin user management** *(2026-06, scope exceptions)* — `/admin/users` directory (read-only list + per-user detail, filters + pagination) plus **create** (`/admin/users/new`), **edit** (`/admin/users/[id]/edit`, email immutable), and **soft delete** (deactivate). Institutional-email + letters-only-name validation; Phòng ban only for DeptStaff; soft-deleted users hidden + SSO-blocked; re-creating a deactivated email revives the row. User lifecycle is normally M1/IAM — built here for the practice/demo per explicit decision.

### Out of scope
- Users without a seeded mock identity (demo) or, in production, a valid SSO account.
- **Self-serve registration / password reset** — the demo's credential note IS the reset. Re-seed to rotate.
- Phòng ban self-closing tickets.
- Direct chat / messaging between users.
- Rating / quality evaluation of resolution.
- Auto-assignment of a specific handler *within* a phòng ban.
- Hard per-category SLA (may be added later).
- **AI triage & solution suggestions (M29)** — *deferred*; v1 builds a clean integration seam but does **not** implement AI (per direction to focus on the core Helpdesk feature for now).
- **Email / Zalo / push notifications** — v1 is in-app only.
- **Ticket reopen** after close — recurrence is handled by creating a new ticket *(assumption, see Open Questions)*.

## 6. Notable refinement vs. ISO

The ISO defines a single **Helpdesk** role. The confirmed **"Lead assigns"** ownership model splits it into **Helpdesk Lead** (dispatch: assigns incoming tickets, may redirect/close) and **Helpdesk Agent** (handles an assigned ticket, forwards to phòng ban, may close). This is what makes "the assigned Helpdesk agent" in the 09:00 reminder well-defined. Per the *quy tắc bất biến*, this refinement is captured here in the Brief (Docs Host tier) before any code, and will be carried into the Feature Plan, Jira stories, and AC.

## 7. Risks & assumptions

### Assumptions
- All phòng ban are onboarded and committed to using the system; their Staff users exist in SSO with correct roles.
- A Helpdesk unit exists with named, trained staff — including a **Helpdesk Lead** for dispatch.
- **M1 SSO/IAM** is the production target and will return accurate role info (SV/GV/NV/Staff/Helpdesk/Admin). For the demo, role info comes from the JWT issued by the FE-facing `POST /auth/login` against seeded mock identities.
- **M2 ESB** is available for inter-module calls; **M3 data lake** is available for the analytics push.
- **Admin** is trained to manage the category list.
- **Cổng SV/GV (M20/M21)** are available to embed the ticket UI and surface in-app notifications.

### Risks → mitigations
- Helpdesk slow to forward → backlog. → Daily 09:00 in-app reminder + management dashboard.
- Phòng ban don't report completion → Helpdesk can't close. → Helpdesk checks proactively; a phòng-ban reminder may be added in a later phase.
- Inaccurate user-declared severity → wrong prioritization. → Helpdesk can override severity.
- Category list too coarse → mis-routing. → Admin edits at runtime; redirect history feeds routing improvements.
- **In-app-only notifications** mean users must log in to see updates → may dampen perceived responsiveness. → Surface prominently in Cổng SV/GV; revisit email in a later iteration.

## 8. Open questions (resolve before publishing this Brief)

1. **"Số ngày tồn đọng" definition** — assumed **days since ticket creation** for any non-Closed ticket (drives both the reminder content and the "<3 days" success metric). Confirm, or should it count from the last status change?
2. **Reopen path** — assumed **no reopen in v1** (recurrence → new ticket). Confirm.
3. **Who may close** — assumed any Helpdesk role member (Lead *or* assigned Agent) may close; Staff/user cannot. Confirm Lead-only vs. Agent-also.
4. **"Working day" for the 09:00 reminder** — follow a school/holiday calendar, or simply Mon–Fri? (Minor; default Mon–Fri excluding public holidays if a calendar is available.)

---

*Traceability: ISO M31 v1.1 → this Brief → (next) Feature Plan → Epic/Stories → Tasks. Once published, the Brief URL is pasted into the corresponding Epic.*
