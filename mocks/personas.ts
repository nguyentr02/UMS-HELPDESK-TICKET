import type { Role } from '@/lib/types/domain';

/**
 * Demo persona credentials — the single source of truth for the credential
 * helper note on /login AND the (Vitest-only) MSW /auth/login handler.
 *
 * Mirrors `prisma/seed.ts` `PERSONAS` in `feat-helpdesk-api/` 1:1 (emails +
 * passwords + ids + roles + display names). Keep the two files in lockstep —
 * a mismatch shows up as a working login on prod that fails in unit tests
 * (or vice versa).
 *
 * Plain text on purpose; these are demo creds.
 */
export interface Persona {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: Role;
  /** Dept CODE (e.g. "CSVC"); the BE returns the resolved cuid in `/auth/me`. */
  departmentCode: string | null;
}

export const PERSONAS: Persona[] = [
  { id: 'u-sv-1',        email: 'sv01@ums.edu.vn',        password: 'sv01-demo!',        displayName: 'SV Nguyễn Văn A',          role: 'SV',            departmentCode: null      },
  { id: 'u-sv-2',        email: 'sv02@ums.edu.vn',        password: 'sv02-demo!',        displayName: 'SV Phạm Thị D',            role: 'SV',            departmentCode: null      },
  { id: 'u-gv-1',        email: 'gv01@ums.edu.vn',        password: 'gv01-demo!',        displayName: 'GV Trần Văn B',            role: 'GV',            departmentCode: null      },
  { id: 'u-gv-2',        email: 'gv02@ums.edu.vn',        password: 'gv02-demo!',        displayName: 'GV Hoàng Văn E',           role: 'GV',            departmentCode: null      },
  { id: 'u-nv-1',        email: 'nv01@ums.edu.vn',        password: 'nv01-demo!',        displayName: 'NV Lê Văn C',              role: 'NV',            departmentCode: null      },
  { id: 'u-nv-2',        email: 'nv02@ums.edu.vn',        password: 'nv02-demo!',        displayName: 'NV Bùi Thị F',             role: 'NV',            departmentCode: null      },
  { id: 'u-hda',         email: 'agent01@ums.edu.vn',     password: 'agent01-demo!',     displayName: 'Đỗ Thị Mai',               role: 'HelpdeskAgent', departmentCode: null      },
  { id: 'u-hda-2',       email: 'agent02@ums.edu.vn',     password: 'agent02-demo!',     displayName: 'Nguyễn Văn Quân',          role: 'HelpdeskAgent', departmentCode: null      },
  { id: 'u-hdl',         email: 'lead01@ums.edu.vn',      password: 'lead01-demo!',      displayName: 'Vũ Văn Hùng',              role: 'HelpdeskLead',  departmentCode: null      },
  { id: 'u-staff',       email: 'staff.csvc@ums.edu.vn',  password: 'staff-csvc-demo!',  displayName: 'Phan Thị Hương (CSVC)',    role: 'DeptStaff',     departmentCode: 'CSVC'    },
  { id: 'u-staff-hcns',  email: 'staff.hcns@ums.edu.vn',  password: 'staff-hcns-demo!',  displayName: 'Lương Văn Đức (HCNS)',     role: 'DeptStaff',     departmentCode: 'HCNS'    },
  { id: 'u-staff-dt',    email: 'staff.dt@ums.edu.vn',    password: 'staff-dt-demo!',    displayName: 'Trịnh Thị Lan (Đào tạo)',  role: 'DeptStaff',     departmentCode: 'DT-CTSV' },
  { id: 'u-admin',       email: 'admin@ums.edu.vn',       password: 'admin-demo!',       displayName: 'Quản trị viên',            role: 'Admin',         departmentCode: null      },
];

/** First persona for the given role — used by tests and the role-default helpers. */
export function defaultPersonaForRole(role: Role): Persona {
  const match = PERSONAS.find((p) => p.role === role);
  if (!match) throw new Error(`No demo persona seeded for role ${role}`);
  return match;
}
