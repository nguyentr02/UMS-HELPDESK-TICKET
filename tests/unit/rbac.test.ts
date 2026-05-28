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
  canRedirect: ['HelpdeskAgent', 'HelpdeskLead'],
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

  it('canComment is true for every role', () => {
    for (const role of ROLES) expect(rbac.canComment(role)).toBe(true);
  });

  it('canCloseTicket: Lead closes any; Agent only when assignee; others never', () => {
    const ticket = { helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' } };
    expect(rbac.canCloseTicket('HelpdeskLead', 'u-hdl', ticket)).toBe(true);
    expect(rbac.canCloseTicket('HelpdeskAgent', 'u-hda', ticket)).toBe(true);
    expect(rbac.canCloseTicket('HelpdeskAgent', 'u-hda2', ticket)).toBe(false);
    expect(rbac.canCloseTicket('DeptStaff', 'u-staff', ticket)).toBe(false);
  });
});
