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

// Flat list of mock SSO identities. `departmentId` is the DEPARTMENT CODE
// for roles that need scoping (resolved to a real Neon cuid at boot via
// `/departments`); null for everyone else. Two identities each for SV/GV/NV
// so the team can simulate cross-user scenarios (e.g. "SV1 creates a ticket,
// SV2 must not see it").
export const MOCK_IDENTITIES: SessionUser[] = [
  { id: 'u-sv-1', displayName: 'SV Nguyễn Văn A', role: 'SV', departmentId: null },
  { id: 'u-sv-2', displayName: 'SV Phạm Thị D', role: 'SV', departmentId: null },
  { id: 'u-gv-1', displayName: 'GV Trần Văn B', role: 'GV', departmentId: null },
  { id: 'u-gv-2', displayName: 'GV Hoàng Văn E', role: 'GV', departmentId: null },
  { id: 'u-nv-1', displayName: 'NV Lê Văn C', role: 'NV', departmentId: null },
  { id: 'u-nv-2', displayName: 'NV Bùi Thị F', role: 'NV', departmentId: null },
  { id: 'u-hda', displayName: 'Đỗ Thị Mai', role: 'HelpdeskAgent', departmentId: null },
  { id: 'u-hdl', displayName: 'Vũ Văn Hùng', role: 'HelpdeskLead', departmentId: null },
  { id: 'u-staff', displayName: 'CB Phòng CSVC', role: 'DeptStaff', departmentId: 'CSVC' },
  { id: 'u-admin', displayName: 'Quản trị viên', role: 'Admin', departmentId: null },
];

const IDENTITY_BY_ID = new Map(MOCK_IDENTITIES.map((u) => [u.id, u]));

// Default identity per role — the first one in MOCK_IDENTITIES for that role.
// Used by setRole() so existing role-based callers (and e2e helpers) keep
// working unchanged.
const DEFAULT_BY_ROLE: Record<Role, SessionUser> = MOCK_IDENTITIES.reduce(
  (acc, u) => {
    if (!(u.role in acc)) (acc as Record<string, SessionUser>)[u.role] = u;
    return acc;
  },
  {} as Record<Role, SessionUser>,
);

export const MOCK_ROLES = Object.keys(DEFAULT_BY_ROLE) as Role[];

const ROLE_KEY = 'm31.mockRole';
const USER_KEY = 'm31.mockUser'; // read by lib/api/client.ts to scope mock responses
const USER_ID_KEY = 'm31.mockUserId'; // pins the chosen identity across reloads
const DEPT_MAP_KEY = 'm31.deptCodeMap'; // { CSVC: <cuid>, HCNS: <cuid>, ... }

function persist(user: SessionUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_KEY, user.role);
  window.localStorage.setItem(USER_ID_KEY, user.id);
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
  if (u.departmentId && deptMap[u.departmentId]) {
    return { ...u, departmentId: deptMap[u.departmentId] };
  }
  return u;
}

interface SessionContextValue {
  user: SessionUser;
  role: Role;
  /** Switch to the default identity for `role` (the first one in MOCK_IDENTITIES). */
  setRole: (role: Role) => void;
  /** Switch to a specific identity by its `id`. */
  setIdentity: (id: string) => void;
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
  const initialUser = DEFAULT_BY_ROLE[initialRole];
  const [user, setUserState] = useState<SessionUser>(initialUser);
  const deptMapRef = useRef<Record<string, string>>(loadDeptMap());

  // Switching the mock identity persists it *synchronously* (so the api client's
  // X-Mock-* headers are correct on the very next fetch) and drops the Query
  // cache, so another identity's data never leaks across the switch.
  const setIdentity = useCallback(
    (id: string) => {
      const target = IDENTITY_BY_ID.get(id);
      if (!target) return;
      const resolved = resolveUser(target, deptMapRef.current);
      persist(resolved);
      setUserState(resolved);
      queryClient.clear();
    },
    [queryClient],
  );

  const setRole = useCallback(
    (next: Role) => setIdentity(DEFAULT_BY_ROLE[next].id),
    [setIdentity],
  );

  // Restore the last-selected mock identity on mount (persists across reloads).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedId = window.localStorage.getItem(USER_ID_KEY);
    if (savedId && IDENTITY_BY_ID.has(savedId)) {
      setIdentity(savedId);
      return;
    }
    // Legacy fallback: m31.mockRole from before identity-level pinning.
    const savedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (savedRole && savedRole in DEFAULT_BY_ROLE) setRole(savedRole);
    else persist(resolveUser(initialUser, deptMapRef.current));
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
        const savedId = window.localStorage.getItem(USER_ID_KEY);
        const activeUser = (savedId ? IDENTITY_BY_ID.get(savedId) : undefined) ?? initialUser;
        const resolved = resolveUser(activeUser, map);
        persist(resolved);
        setUserState(resolved);
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
    () => ({ user, role: user.role, setRole, setIdentity }),
    [user, setRole, setIdentity],
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
