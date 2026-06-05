'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Role, UserRef } from '@/lib/types/domain';
import { useMeQuery } from '@/lib/queries/auth';

export interface SessionUser extends UserRef {
  role: Role;
  departmentId: string | null;
}

interface SessionContextValue {
  /** Authenticated user when present, `null` while pending / unauthenticated. */
  user: SessionUser | null;
  /** Convenience — same as `user?.role`, narrowed to `null` when there's no session yet. */
  role: Role | null;
  /** `false` until `GET /auth/me` has settled (success or 401). */
  isReady: boolean;
  /** `true` while an auth-affecting mutation is in flight (login/logout); UI can keep showing the splash. */
  isTransitioning: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * SessionProvider — pulls the current user from `useMeQuery` (single source of
 * truth). On the deployed app this hits `GET /auth/me` against the BE; in
 * Vitest the MSW handler resolves it from either the mock cookie set by the
 * MSW login handler or the legacy `X-Mock-*` headers written by
 * `renderWithProviders({ role })`.
 *
 * Public API stays small on purpose: `useSession()` for routes inside the
 * `AuthGate` (where `user` is guaranteed non-null) and `useSessionOptional()`
 * for the few surfaces that render *around* the gate (boot splash, notification
 * provider in test isolation).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const me = useMeQuery();
  const meUser = me.data?.user ?? null;

  // Memoize the user object on the underlying identity fields so the
  // SessionContext value doesn't churn on every render (which would force every
  // useSession() consumer to re-render unnecessarily).
  const user = useMemo<SessionUser | null>(() => {
    if (!meUser) return null;
    return {
      id: meUser.id,
      displayName: meUser.displayName,
      role: meUser.role,
      departmentId: meUser.departmentId,
    };
  }, [meUser]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      // Done loading the moment the query resolves — even a 401 counts as
      // "ready" so the AuthGate can flip to the redirect path.
      isReady: !me.isPending,
      // Fetching (refetches after invalidate) → the boot gate keeps the splash up.
      isTransitioning: me.isFetching && !me.isPending && me.data !== undefined,
    }),
    [user, me.isPending, me.isFetching, me.data],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Asserts a session is present. Throws if called outside the provider, or
 * inside the provider before `AuthGate` has redirected an unauthenticated
 * caller to `/login`. Use inside any route that the AuthGate protects.
 */
export function useSession(): SessionContextValue & { user: SessionUser; role: Role } {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  if (!ctx.user) throw new Error('useSession called without an authenticated user');
  return ctx as SessionContextValue & { user: SessionUser; role: Role };
}

/**
 * Non-throwing variant for surfaces that may legitimately render without a
 * session (the loading splash, the landing page, isolated unit tests for
 * components that don't need identity).
 */
export function useSessionOptional(): SessionContextValue | null {
  return useContext(SessionContext);
}

export function useRole(): Role {
  return useSession().role;
}
