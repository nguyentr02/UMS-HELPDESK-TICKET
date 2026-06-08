'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionOptional } from '@/lib/auth/session';
import { safeNextForRole } from '@/lib/auth/nav';
import { LoadingSplash } from '@/components/layout/loading-splash';

/** Routes that anyone can reach without a session. */
const PUBLIC_PATHS = new Set<string>(['/', '/login']);

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

/**
 * Top-level route guard. Truth table (Feature Plan §11.5):
 *
 *  | path               | user === null            | user !== null              |
 *  |--------------------|--------------------------|----------------------------|
 *  | `/` (landing)      | render landing           | render landing             |
 *  | `/login`           | render login page        | redirect to homeRouteFor   |
 *  | anywhere else      | redirect `/login?next=…` | render the route           |
 *
 * While `useMeQuery` is still pending we render the loading splash for any
 * non-public path so protected routes never flash empty before the redirect.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const ctx = useSessionOptional();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const user = ctx?.user ?? null;
  const isReady = ctx?.isReady ?? false;

  useEffect(() => {
    if (!isReady) return;
    // Read the URL via `window.location` rather than `useSearchParams` so we
    // don't force the whole route into a Suspense boundary — `useSearchParams`
    // opts a page out of static optimization in Next 14 unless explicitly
    // wrapped. The effect only runs in the browser, so `window` is safe here.
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (!user && !isPublic(pathname)) {
      const next = encodeURIComponent(`${pathname}${search}`);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (user && pathname === '/login') {
      const params = new URLSearchParams(search);
      const rawNext = params.get('next');
      const decoded = rawNext ? decodeURIComponent(rawNext) : null;
      // Validate `next` against the role — without this, an SV bouncing
      // through `/login?next=%2Fanalytics` would be sent to a Lead-only
      // route and 403 on the first data call.
      router.replace(safeNextForRole(decoded, user.role));
    }
  }, [isReady, user, pathname, router]);

  // Bfcache (browser back/forward cache) defense: when the user hits Back
  // *after* logging out, the browser may restore the previously-viewed
  // protected page directly from its in-memory snapshot — React components
  // aren't re-mounted, so the effect above never runs and the stale logged-in
  // UI is shown for a user whose cookie is already gone.
  //
  // The `pageshow` event fires both on initial load AND on bfcache restoration,
  // with `event.persisted === true` distinguishing the latter. Force a full
  // reload in that case so the session is re-evaluated from scratch.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload();
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  // Public paths render unconditionally — landing/login handle their own auth-aware logic.
  if (isPublic(pathname)) return <>{children}</>;
  // While the boot query is pending (or we've decided to redirect), don't leak protected content.
  if (!isReady || !user) return <LoadingSplash />;
  return <>{children}</>;
}
