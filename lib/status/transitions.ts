import type { TicketStatus } from '@/lib/types/domain';

// Status-side guards mirroring the feature-plan App. B state machine. The FE hides
// controls the current status can't perform; the server `409` is the authoritative
// backstop for races. Role-side guards live in `lib/auth/rbac.ts`.

// Forward: PENDING→ASSIGNED.
export const canForwardFrom = (s: TicketStatus): boolean => s === 'Pending';

// Start progress: ASSIGNED→IN_PROGRESS.
export const canProgressFrom = (s: TicketStatus): boolean => s === 'Assigned';

// Assign owner / override severity / re-categorise / close: any non-terminal
// (CLOSED is terminal).
export const canAssignFrom = (s: TicketStatus): boolean => s !== 'Closed';
export const canCategorizeFrom = (s: TicketStatus): boolean => s !== 'Closed';
export const canOverrideSeverityFrom = (s: TicketStatus): boolean => s !== 'Closed';
export const canCloseFrom = (s: TicketStatus): boolean => s !== 'Closed';
