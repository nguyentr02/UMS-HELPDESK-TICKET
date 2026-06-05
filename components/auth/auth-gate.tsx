'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionOptional } from '@/lib/auth/session';
import { homeRouteFor } from '@/lib/auth/nav';
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
      const target = rawNext ? decodeURIComponent(rawNext) : homeRouteFor(user.role);
      router.replace(target);
    }
  }, [isReady, user, pathname, router]);

  // Public paths render unconditionally — landing/login handle their own auth-aware logic.
  if (isPublic(pathname)) return <>{children}</>;
  // While the boot query is pending (or we've decided to redirect), don't leak protected content.
  if (!isReady || !user) return <LoadingSplash />;
  return <>{children}</>;
}
