'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useIsRestoring } from '@tanstack/react-query';
import { useSessionOptional } from '@/lib/auth/session';
import { LoadingSplash } from './loading-splash';

/**
 * Shows the branded loading screen until:
 *  (a) `GET /auth/me` has resolved (success or 401),
 *  (b) the React Query persister has finished rehydrating its cache, and
 *  (c) no auth-affecting mutation is still flying (`isTransitioning`).
 *
 * The landing page (`/`) and `/login` render unconditionally — they own their
 * own auth-aware UX (the landing CTA branches on `useMeQuery`; `/login` IS the
 * unauthenticated entry).
 */
export function AppBootGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ctx = useSessionOptional();
  const isRestoring = useIsRestoring();
  if (pathname === '/' || pathname === '/login') return <>{children}</>;
  const isReady = ctx?.isReady ?? false;
  const isTransitioning = ctx?.isTransitioning ?? false;
  if (isReady && !isRestoring && !isTransitioning) return <>{children}</>;
  return <LoadingSplash />;
}
