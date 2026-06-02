'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useIsRestoring } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/session';
import { LoadingSplash } from './loading-splash';

/**
 * Shows the branded loading screen until (a) the SessionProvider has restored
 * the pinned identity from localStorage and (b) the React Query persister has
 * finished rehydrating its cache. Once both are settled the real app renders
 * in one clean frame without flashing default-role chrome or empty-state
 * placeholders.
 *
 * The landing page (`/`) doesn't depend on session or cache, so the gate
 * passes through there — otherwise users would see a ~0.5s loading flash
 * before the landing renders on first visit. The 2s brand moment between
 * landing → app is owned by the landing page itself (see app/page.tsx).
 */
export function AppBootGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isReady } = useSession();
  const isRestoring = useIsRestoring();
  if (pathname === '/') return <>{children}</>;
  if (isReady && !isRestoring) return <>{children}</>;
  return <LoadingSplash />;
}
