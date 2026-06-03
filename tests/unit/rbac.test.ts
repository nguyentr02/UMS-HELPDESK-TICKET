import { describe, it, expect } from 'vitest';
import type { Role } from '@/lib/types/domain';
import * as rbac from '@/lib/auth/rbac';

const ROLES: Role[] = ['SV', 'GV', 'NV', 'HelpdeskAgent', 'HelpdeskLead', 'DeptStaff', 'Admin'];

// Mirror of docs/role-permission-matrix.md (the roles for which each predicate is ✅).
const MATRIX: Record<string, Role[]> = {
  canCreate: ['SV', 'GV', 'NV', 'DeptStaff'],
  canViewOwn: ['SV', 'GV', 'NV', 'DeptStaff'],
  canViewQueue: ['HelpdeskAgent', 'HelpdeskLead', 'Admin'],
  canViewDeptQueue: ['DeptStaff', 'Admin'],
  canAssign: ['HelpdeskLead'],
  canForward: ['HelpdeskAgent', 'HelpdeskLead'],
  canOverrideSeverity: ['HelpdeskAgent', 'HelpdeskLead'],
  canUpdateProgress: ['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'],
  canClose: ['HelpdeskAgent', 'HelpdeskLead'],
  canViewDashboard: ['HelpdeskLead', 'Admin'],
  canManageCategories: ['Admin'],
  canManageRouting: ['Admin'],
  receivesDailyReminder: ['HelpdeskAgent', 'HelpdeskLead', 'DeptStaff'],
};

const fns = rbac as unknown as Record<string, (r: Role) => boolean>;

describe('rbac predicates match role-permission-matrix.md', () => {
  for (const [fnName, allowed] of Object.entries(MATRIX)) {
    for (const role of ROLES) {
      const expected = allowed.includes(role);
      it(`${fnName}(${role}) === ${expected}`, () => {
        expect(fns[fnName](role)).toBe(expected);
      });
    }
  }

  it('canComment: closed blocks everyone; per-role scoping otherwise', () => {
    const requester = { id: 'u-sv-1', displayName: 'SV' } as const;
    const agent = { id: 'u-hda', displayName: 'Agent' } as const;
    const dept = { id: 'd-csvc', code: 'CSVC', name: 'CSVC' } as const;

    const open = {
      internalStatus: 'Assigned' as const,
      requester,
      helpdeskAssignee: agent,
      routedDepartment: dept,
    };
    const closed = { ...open, internalStatus: 'Closed' as const };

    // Closed → nobody can comment.
    for (const role of ROLES) expect(rbac.canComment(role, 'anyone', closed)).toBe(false);

    // Lead / Admin → any non-closed.
    expect(rbac.canComment('HelpdeskLead', 'u-hdl', open)).toBe(true);
    expect(rbac.canComment('Admin', 'u-admin', open)).toBe(true);

    // Agent → only their assigned ticket.
    expect(rbac.canComment('HelpdeskAgent', 'u-hda', open)).toBe(true);
    expect(rbac.canComment('HelpdeskAgent', 'u-hda-2', open)).toBe(false);

    // DeptStaff → only when callerDeptId matches the routed dept.
    expect(rbac.canComment('DeptStaff', 'u-staff', open, 'd-csvc')).toBe(true);
    expect(rbac.canComment('DeptStaff', 'u-staff', open, 'd-other')).toBe(false);

    // Requester → only their own ticket.
    expect(rbac.canComment('SV', 'u-sv-1', open)).toBe(true);
    expect(rbac.canComment('SV', 'u-sv-2', open)).toBe(false);
  });

  it('canCloseTicket: Lead closes any; Agent only when assignee; others never', () => {
    const ticket = { helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' } };
    expect(rbac.canCloseTicket('HelpdeskLead', 'u-hdl', ticket)).toBe(true);
    expect(rbac.canCloseTicket('HelpdeskAgent', 'u-hda', ticket)).toBe(true);
    expect(rbac.canCloseTicket('HelpdeskAgent', 'u-hda2', ticket)).toBe(false);
    expect(rbac.canCloseTicket('DeptStaff', 'u-staff', ticket)).toBe(false);
  });
});
