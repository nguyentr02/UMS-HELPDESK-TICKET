'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const user = ctx?.user ?? null;
  const isReady = ctx?.isReady ?? false;

  useEffect(() => {
    if (!isReady) return;
    if (!user && !isPublic(pathname)) {
      const next = encodeURIComponent(`${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (user && pathname === '/login') {
      const rawNext = searchParams?.get('next');
      const target = rawNext ? decodeURIComponent(rawNext) : homeRouteFor(user.role);
      router.replace(target);
    }
  }, [isReady, user, pathname, router, searchParams]);

  // Public paths render unconditionally — landing/login handle their own auth-aware logic.
  if (isPublic(pathname)) return <>{children}</>;
  // While the boot query is pending (or we've decided to redirect), don't leak protected content.
  if (!isReady || !user) return <LoadingSplash />;
  return <>{children}</>;
}
