'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useIsRestoring } from '@tanstack/react-query';
import { Headset, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth/session';

const FIRST_LOAD_MIN_MS = 2000;

/** True on the first navigation into the tab (not a reload, not back/forward). */
function isFirstLoad(): boolean {
  if (typeof performance === 'undefined') return true;
  const entry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return entry?.type === 'navigate';
}

/**
 * Full-screen loading screen shown on first paint and on every reload until
 * (a) the SessionProvider has restored the pinned identity from localStorage
 * and (b) the React Query persister has finished rehydrating its cache. Once
 * both are settled, the real app renders in a clean single frame instead of
 * flashing default-role chrome or empty-state placeholders.
 *
 * On a true first load (fresh tab, not a reload) we also hold the screen for
 * at least FIRST_LOAD_MIN_MS so the brand registers; reloads still clear as
 * soon as the cache lands.
 */
export function AppBootGate({ children }: { children: ReactNode }) {
  const { isReady } = useSession();
  const isRestoring = useIsRestoring();
  const [minHoldElapsed, setMinHoldElapsed] = useState(() => !isFirstLoad());

  useEffect(() => {
    if (minHoldElapsed) return;
    const t = setTimeout(() => setMinHoldElapsed(true), FIRST_LOAD_MIN_MS);
    return () => clearTimeout(t);
  }, [minHoldElapsed]);

  if (isReady && !isRestoring && minHoldElapsed) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
          <Headset className="h-7 w-7" aria-hidden />
        </span>
        <span className="text-2xl font-semibold tracking-tight">DAU Helpdesk</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>Đang tải…</span>
      </div>
    </div>
  );
}
