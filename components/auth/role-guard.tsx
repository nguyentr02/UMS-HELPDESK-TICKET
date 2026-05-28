'use client';

import type { ReactNode } from 'react';
import type { Role } from '@/lib/types/domain';
import { useRole } from '@/lib/auth/session';

/**
 * Renders `children` only when the current role satisfies `allow`.
 * Defense-in-depth for the UI — server RBAC is still the authority.
 */
export function RoleGuard({
  allow,
  children,
  fallback = null,
}: {
  allow: (role: Role) => boolean;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const role = useRole();
  return <>{allow(role) ? children : fallback}</>;
}
