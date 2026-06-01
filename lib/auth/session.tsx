'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { listDepartments } from '@/lib/api/departments';
import type { Role, UserRef } from '@/lib/types/domain';

export interface SessionUser extends UserRef {
  role: Role;
  departmentId: string | null;
}

// Mock SSO identities. `departmentId` here is the DEPARTMENT CODE (matches
// the BE seed) for roles that need scoping; null for everyone else. The codes
// are resolved to real Neon cuids at boot via `/departments` so the BE's
// dept-scoped query (`routedDepartmentId = caller.departmentId`) actually
// matches rows.
const MOCK_USERS: Record<Role, SessionUser> = {
  SV: { id: 'u-sv', displayName: 'SV Nguyễn Văn A', role: 'SV', departmentId: null },
  GV: { id: 'u-gv', displayName: 'GV Trần Văn B', role: 'GV', departmentId: null },
  NV: { id: 'u-nv', displayName: 'NV Lê Văn C', role: 'NV', departmentId: null },
  HelpdeskAgent: { id: 'u-hda', displayName: 'Đỗ Thị Mai', role: 'HelpdeskAgent', departmentId: null },
  HelpdeskLead: { id: 'u-hdl', displayName: 'Vũ Văn Hùng', role: 'HelpdeskLead', departmentId: null },
  DeptStaff: { id: 'u-staff', displayName: 'CB Phòng CSVC', role: 'DeptStaff', departmentId: 'CSVC' },
  Admin: { id: 'u-admin', displayName: 'Quản trị viên', role: 'Admin', departmentId: null },
};

export const MOCK_ROLES = Object.keys(MOCK_USERS) as Role[];
const ROLE_KEY = 'm31.mockRole';
const USER_KEY = 'm31.mockUser'; // read by lib/api/client.ts to scope mock responses
const DEPT_MAP_KEY = 'm31.deptCodeMap'; // { CSVC: <cuid>, HCNS: <cuid>, ... }

function persist(user: SessionUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_KEY, user.role);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function loadDeptMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(DEPT_MAP_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function resolveUser(u: SessionUser, deptMap: Record<string, string>): SessionUser {
  // If `departmentId` looks like a code we know about, swap it for the real
  // cuid. Anything else (null, already-a-cuid, unknown code) passes through.
  if (u.departmentId && deptMap[u.departmentId]) {
    return { ...u, departmentId: deptMap[u.departmentId] };
  }
  return u;
}

interface SessionContextValue {
  user: SessionUser;
  role: Role;
  setRole: (role: Role) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  initialRole = 'SV',
}: {
  children: ReactNode;
  initialRole?: Role;
}) {
  const queryClient = useQueryClient();
  const [role, setRoleState] = useState<Role>(initialRole);
  const deptMapRef = useRef<Record<string, string>>(loadDeptMap());

  // Switching the mock identity persists it *synchronously* (so the api client's
  // X-Mock-* headers are correct on the very next fetch) and drops the Query
  // cache, so another identity's data never leaks across a role switch.
  const setRole = useCallback(
    (next: Role) => {
      persist(resolveUser(MOCK_USERS[next], deptMapRef.current));
      setRoleState(next);
      queryClient.clear();
    },
    [queryClient],
  );

  // Restore the last-selected mock role on mount (persists across reloads).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (saved && saved in MOCK_USERS) setRole(saved);
    else persist(resolveUser(MOCK_USERS[initialRole], deptMapRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One-shot: fetch /departments at boot so we can swap mock dept *codes* for
  // real Neon cuids in any session. Without this the BE filter
  // `routedDepartmentId = caller.departmentId` never matches and DeptStaff's
  // queue stays empty.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    (async () => {
      try {
        const depts = await listDepartments();
        if (!active) return;
        const map: Record<string, string> = {};
        for (const d of depts) map[d.code] = d.id;
        deptMapRef.current = map;
        window.localStorage.setItem(DEPT_MAP_KEY, JSON.stringify(map));
        // Re-persist the current session with the now-resolved cuid so the
        // next fetch carries the correct X-Mock-Dept-Id.
        const saved = window.localStorage.getItem(ROLE_KEY) as Role | null;
        const activeRole = saved && saved in MOCK_USERS ? saved : initialRole;
        persist(resolveUser(MOCK_USERS[activeRole], map));
        queryClient.invalidateQueries();
      } catch {
        /* network/auth hiccup — leave the cached map (if any) in place */
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user: MOCK_USERS[role], role, setRole }),
    [role, setRole],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}

export function useRole(): Role {
  return useSession().role;
}
