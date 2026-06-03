import type { Department, Role, TicketStatus, UserRef } from '@/lib/types/domain';

// Capability predicates — a 1:1 implementation of `docs/role-permission-matrix.md`
// (§Implementation notes). The matrix is the source of truth; keep these verbatim.

export const REQUESTER_ROLES: Role[] = ['SV', 'GV', 'NV'];
export const HELPDESK_ROLES: Role[] = ['HelpdeskAgent', 'HelpdeskLead'];

export const isRequester = (r: Role): boolean => REQUESTER_ROLES.includes(r);
export const isHelpdesk = (r: Role): boolean => HELPDESK_ROLES.includes(r);

export const canCreate = (r: Role): boolean => ['SV', 'GV', 'NV', 'DeptStaff'].includes(r);
export const canViewOwn = (r: Role): boolean => ['SV', 'GV', 'NV', 'DeptStaff'].includes(r);
export const canViewQueue = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead', 'Admin'].includes(r);
export const canViewDeptQueue = (r: Role): boolean => ['DeptStaff', 'Admin'].includes(r);
/**
 * Comment authority. Two hard rules layered on top of role:
 *   1. **Closed tickets cannot be commented on by anyone.**
 *   2. Each role only on tickets they own / serve:
 *      - HelpdeskLead / Admin → any (non-closed)
 *      - HelpdeskAgent        → only the ticket they're assigned to
 *      - DeptStaff            → only tickets routed to their dept
 *      - SV / GV / NV         → only their own
 */
export function canComment(
  role: Role,
  callerId: string,
  ticket: {
    internalStatus: TicketStatus;
    requester: UserRef;
    helpdeskAssignee: UserRef | null;
    routedDepartment: Department | null;
  },
  callerDeptId?: string | null,
): boolean {
  if (ticket.internalStatus === 'Closed') return false;
  switch (role) {
    case 'Admin':
    case 'HelpdeskLead':
      return true;
    case 'HelpdeskAgent':
      return ticket.helpdeskAssignee?.id === callerId;
    case 'DeptStaff':
      return !!callerDeptId && ticket.routedDepartment?.id === callerDeptId;
    case 'SV':
    case 'GV':
    case 'NV':
      return ticket.requester.id === callerId;
    default:
      return false;
  }
}
export const canAssign = (r: Role): boolean => r === 'HelpdeskLead';
export const canForward = (r: Role): boolean => ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canOverrideSeverity = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canUpdateProgress = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'].includes(r);
export const canClose = (r: Role): boolean => ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canViewDashboard = (r: Role): boolean => ['HelpdeskLead', 'Admin'].includes(r);
export const canManageCategories = (r: Role): boolean => r === 'Admin';
export const canManageRouting = (r: Role): boolean => r === 'Admin';
export const receivesDailyReminder = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'].includes(r);

/**
 * Close has a role gate **and** an ownership backstop (Brief §0.7): a Lead may
 * close any ticket, but an Agent may close only the ticket they're assigned to.
 */
export function canCloseTicket(
  role: Role,
  userId: string,
  ticket: { helpdeskAssignee: UserRef | null },
): boolean {
  if (!canClose(role)) return false;
  if (role === 'HelpdeskLead') return true;
  return ticket.helpdeskAssignee?.id === userId;
}
