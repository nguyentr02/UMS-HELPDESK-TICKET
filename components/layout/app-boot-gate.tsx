'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useIsRestoring } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/session';
import { LoadingSplash } from './loading-splash';

/**
 * Shows the branded loading screen until:
 *  (a) the SessionProvider has restored the pinned identity from localStorage,
 *  (b) the React Query persister has finished rehydrating its cache, and
 *  (c) any in-flight identity switch (~200 ms) has settled. The bell's own
 *      in-badge spinner (~1 s, see notification-bell.tsx) covers any per-query
 *      lag after the splash hides, so this window can stay short.
 *
 * Once all three are settled the real app renders in one clean frame without
 * flashing default-role chrome, empty-state placeholders, or the previous
 * identity's data leaking through during a switch.
 *
 * The landing page (`/`) doesn't depend on session or cache, so the gate
 * passes through there — otherwise users would see a ~0.5 s loading flash
 * before the landing renders on first visit. The 2 s brand moment between
 * landing → app is owned by the landing page itself (see app/page.tsx).
 */
export function AppBootGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isReady, isTransitioning } = useSession();
  const isRestoring = useIsRestoring();
  if (pathname === '/') return <>{children}</>;
  if (isReady && !isRestoring && !isTransitioning) return <>{children}</>;
  return <LoadingSplash />;
}
