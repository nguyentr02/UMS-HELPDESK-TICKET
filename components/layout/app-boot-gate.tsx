'use client';

import { type ReactNode } from 'react';
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
 * Landing-page first-impression duration is owned by the landing page itself
 * (see app/page.tsx), so the gate no longer enforces a minimum hold.
 */
export function AppBootGate({ children }: { children: ReactNode }) {
  const { isReady } = useSession();
  const isRestoring = useIsRestoring();
  if (isReady && !isRestoring) return <>{children}</>;
  return <LoadingSplash />;
}
