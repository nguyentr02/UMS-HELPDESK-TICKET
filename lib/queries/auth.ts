import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type AuthEnvelope,
  fetchMe,
  type LoginRequest,
  loginRequest,
  logoutRequest,
  type SessionUser,
} from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * The single source of truth for "who am I?". Runs once on mount and again
 * after a login/logout mutation invalidates it. 401 is the *expected* unauthed
 * state — we don't retry it, and the AuthGate uses `data == null` to decide
 * between splash / login redirect / render.
 *
 * Data shape: `AuthEnvelope` (logged-in) | `null` (explicitly logged-out, set
 * by `useLogoutMutation`'s `onSettled`) | `undefined` (still loading).
 */
export function useMeQuery() {
  return useQuery<AuthEnvelope | null, ApiError>({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for /login form submission. On success, write the user to the
 * `authKeys.me` cache so the AuthGate flips immediately without waiting for
 * a refetch.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation<AuthEnvelope, ApiError, LoginRequest>({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data);
    },
  });
}

/**
 * Logout — clears the session cookie, then *every* TanStack Query so no
 * previous user's data leaks across into the next session. Caller is expected
 * to `router.push('/login')` afterwards.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      // Drop every cached query so the next user's data doesn't leak.
      queryClient.clear();
      // ⚠️ `clear()` removes cache entries but **does not** trigger active query
      // observers to refetch — the SessionProvider's `useMeQuery` would still
      // hold the previous user object. We explicitly seed `authKeys.me` to
      // `null` so observers see "logged out" immediately, AuthGate redirects,
      // and we don't race a stale-cache refetch against the navigation. `null`
      // (not `undefined`) because TanStack treats `undefined` as "no data,
      // please refetch" — which would re-hit /auth/me and bounce back.
      queryClient.setQueryData<AuthEnvelope | null>(authKeys.me, null);
    },
  });
}

export type { SessionUser };
