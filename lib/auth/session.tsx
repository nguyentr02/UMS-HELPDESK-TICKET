'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role, UserRef } from '@/lib/types/domain';

export interface SessionUser extends UserRef {
  role: Role;
  departmentId: string | null;
}

// Mock SSO identities — one per role (real SSO comes from M1; mocked for the practice run).
const MOCK_USERS: Record<Role, SessionUser> = {
  SV: { id: 'u-sv', displayName: 'SV Nguyễn Văn A', role: 'SV', departmentId: null },
  GV: { id: 'u-gv', displayName: 'GV Trần Văn B', role: 'GV', departmentId: null },
  NV: { id: 'u-nv', displayName: 'NV Lê Văn C', role: 'NV', departmentId: null },
  HelpdeskAgent: { id: 'u-hda', displayName: 'Helpdesk Agent', role: 'HelpdeskAgent', departmentId: 'dep-helpdesk' },
  HelpdeskLead: { id: 'u-hdl', displayName: 'Helpdesk Lead', role: 'HelpdeskLead', departmentId: 'dep-helpdesk' },
  DeptStaff: { id: 'u-staff', displayName: 'CB Phòng CSVC', role: 'DeptStaff', departmentId: 'dep-csvc' },
  Admin: { id: 'u-admin', displayName: 'Quản trị viên', role: 'Admin', departmentId: null },
};

export const MOCK_ROLES = Object.keys(MOCK_USERS) as Role[];
const ROLE_KEY = 'm31.mockRole';
const USER_KEY = 'm31.mockUser'; // read by lib/api/client.ts to scope mock responses

function persist(user: SessionUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_KEY, user.role);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
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
  const [role, setRole] = useState<Role>(initialRole);

  // Restore the last-selected mock role on mount (persists across reloads).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (saved && saved in MOCK_USERS) setRole(saved);
    else persist(MOCK_USERS[initialRole]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep localStorage in sync so the api client forwards the current identity.
  useEffect(() => {
    persist(MOCK_USERS[role]);
  }, [role]);

  const value = useMemo<SessionContextValue>(
    () => ({ user: MOCK_USERS[role], role, setRole }),
    [role],
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
