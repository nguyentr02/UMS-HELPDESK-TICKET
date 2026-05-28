import type { Role, UserRef } from '@/lib/types/domain';

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
// Comment is allowed for every authenticated role (matrix). `role` kept for a uniform signature.
export const canComment = (_r: Role): boolean => true;
export const canAssign = (r: Role): boolean => r === 'HelpdeskLead';
export const canForward = (r: Role): boolean => ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
export const canRedirect = (r: Role): boolean => ['HelpdeskAgent', 'HelpdeskLead'].includes(r);
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
