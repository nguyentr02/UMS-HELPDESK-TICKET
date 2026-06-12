import type { TicketStatus } from '@/lib/types/domain';

// Status-side guards mirroring the feature-plan App. B state machine. The FE hides
// controls the current status can't perform; the server `409` is the authoritative
// backstop for races. Role-side guards live in `lib/auth/rbac.ts`.

// "Active" = the three statuses where normal triage actions apply. `Closed` is
// terminal; `CloseRequested` is a paused state where ONLY review (approve/refuse)
// actions apply — mirrors the BE `allowedFrom` sets so the FE never offers an
// action the server would 409.
const ACTIVE: readonly TicketStatus[] = ['Pending', 'Assigned', 'InProgress'];
const isActive = (s: TicketStatus): boolean => ACTIVE.includes(s);

// Forward: PENDING→ASSIGNED.
export const canForwardFrom = (s: TicketStatus): boolean => s === 'Pending';

// Start progress: ASSIGNED→IN_PROGRESS.
export const canProgressFrom = (s: TicketStatus): boolean => s === 'Assigned';

// Direct redirect: re-route an already-routed ticket (Assigned or InProgress).
export const canRedirectFrom = (s: TicketStatus): boolean =>
  s === 'Assigned' || s === 'InProgress';

// Assign owner / override severity / re-categorise / direct close: any active
// status (not Closed, not CloseRequested).
export const canAssignFrom = isActive;
export const canCategorizeFrom = isActive;
export const canOverrideSeverityFrom = isActive;
export const canCloseFrom = isActive;

// DeptStaff requests close: only while IN_PROGRESS.
export const canRequestCloseFrom = (s: TicketStatus): boolean => s === 'InProgress';

// Agent/Lead reviews (approve/refuse) a pending close request.
export const canReviewCloseFrom = (s: TicketStatus): boolean => s === 'CloseRequested';

// DeptStaff requests a redirect: while Assigned or InProgress.
export const canRequestRedirectFrom = (s: TicketStatus): boolean =>
  s === 'Assigned' || s === 'InProgress';

// Agent/Lead reviews (approve/refuse) a pending redirect request.
export const canReviewRedirectFrom = (s: TicketStatus): boolean => s === 'RedirectRequested';
