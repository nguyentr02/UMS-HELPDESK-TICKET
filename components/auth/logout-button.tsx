'use client';

import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLogoutMutation } from '@/lib/queries/auth';

type Variant = 'sidebar' | 'topbar';

const PERSISTED_QUERY_CACHE_KEY = 'ums-rq-cache';

/**
 * Đăng xuất button — lives in the sidebar footer (full-width row) and in the
 * top bar (compact icon + label). On click:
 *  1. POST /auth/logout (BE clears the `ums_session` cookie).
 *  2. Drop the persisted TanStack Query cache from localStorage so a reload
 *     can't restore the previous user's data.
 *  3. **Hard-navigate** to `/login` via `window.location` rather than
 *     `router.replace`. The full reload wipes every bit of in-memory React
 *     state — no race between the cleared cookie, the cache invalidate, and
 *     the AuthGate's `user && pathname === '/login'` branch (which would
 *     otherwise bounce a stale-cache observer back to the role's home).
 */
export function LogoutButton({
  variant = 'topbar',
  onAfter,
}: {
  variant?: Variant;
  onAfter?: () => void;
}) {
  const logout = useLogoutMutation();

  async function handleClick() {
    try {
      await logout.mutateAsync();
    } catch {
      // Network failure on logout is acceptable — the cookie is what matters,
      // and the server-side `Set-Cookie` may have arrived even if the envelope
      // didn't parse. Push to /login regardless.
    }
    onAfter?.();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
      window.location.href = '/login';
    }
  }

  if (variant === 'sidebar') {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleClick}
        disabled={logout.isPending}
        aria-label="Đăng xuất"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Đăng xuất
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
      onClick={handleClick}
      disabled={logout.isPending}
      aria-label="Đăng xuất"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Đăng xuất</span>
    </Button>
  );
}
