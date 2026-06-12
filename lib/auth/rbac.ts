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
/** Direct redirect (re-route an already-assigned ticket). Role gate; ownership in canRedirectTicket. */
export const canRedirect = (r: Role): boolean => ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canCategorize = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canOverrideSeverity = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canUpdateProgress = (r: Role): boolean =>
  ['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'].includes(r);
export const canClose = (r: Role): boolean => ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canViewDashboard = (r: Role): boolean => ['HelpdeskLead', 'Admin'].includes(r);
export const canManageCategories = (r: Role): boolean => r === 'Admin';
/** Admin-only: read-only user directory. No create/update/delete — users come from other UMS modules. */
export const canViewUsers = (r: Role): boolean => r === 'Admin';
/**
 * Admin-only: create a user inside Helpdesk. This deliberately steps outside
 * the helpdesk's bounded context (M1 / IAM normally owns user lifecycle);
 * kept here for the practice/demo flow per explicit product decision.
 */
export const canCreateUsers = (r: Role): boolean => r === 'Admin';
/** Admin-only: edit a user (displayName / role / dept / password). Same scope-exception caveat as create. */
export const canUpdateUsers = (r: Role): boolean => r === 'Admin';
/** Admin-only: soft-delete (deactivate) a user. The BE blocks self-delete with 409. */
export const canDeleteUsers = (r: Role): boolean => r === 'Admin';
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

/**
 * Direct redirect ownership: a Lead may re-route any ticket, an Agent only the
 * one assigned to them (same rule as close).
 */
export function canRedirectTicket(
  role: Role,
  userId: string,
  ticket: { helpdeskAssignee: UserRef | null },
): boolean {
  if (!canRedirect(role)) return false;
  if (role === 'HelpdeskLead') return true;
  return ticket.helpdeskAssignee?.id === userId;
}

/** DeptStaff may request a close (with proof). Role gate; the component also
 *  checks the ticket is InProgress and routed to the staffer's department. */
export const canRequestClose = (r: Role): boolean => r === 'DeptStaff';

/** Per-ticket gate for requesting a close: DeptStaff of the routed dept only. */
export function canRequestCloseTicket(
  role: Role,
  userDepartmentId: string | null,
  ticket: { routedDepartment: { id: string } | null },
): boolean {
  if (!canRequestClose(role)) return false;
  return !!userDepartmentId && ticket.routedDepartment?.id === userDepartmentId;
}

/**
 * Review (approve/refuse) a pending close request — same ownership rule as a
 * direct close: a Lead may review any, an Agent only the ticket assigned to them.
 */
export function canReviewCloseRequest(
  role: Role,
  userId: string,
  ticket: { helpdeskAssignee: UserRef | null },
): boolean {
  return canCloseTicket(role, userId, ticket);
}

/** DeptStaff may request a redirect. Role gate; component also checks the ticket
 *  is Assigned/InProgress and routed to the staffer's department. */
export const canRequestRedirect = (r: Role): boolean => r === 'DeptStaff';

/** Per-ticket gate for requesting a redirect: DeptStaff of the routed dept only. */
export function canRequestRedirectTicket(
  role: Role,
  userDepartmentId: string | null,
  ticket: { routedDepartment: { id: string } | null },
): boolean {
  if (!canRequestRedirect(role)) return false;
  return !!userDepartmentId && ticket.routedDepartment?.id === userDepartmentId;
}

/** Review (approve/refuse) a redirect request — same ownership rule as redirect. */
export function canReviewRedirectRequest(
  role: Role,
  userId: string,
  ticket: { helpdeskAssignee: UserRef | null },
): boolean {
  return canRedirectTicket(role, userId, ticket);
}
