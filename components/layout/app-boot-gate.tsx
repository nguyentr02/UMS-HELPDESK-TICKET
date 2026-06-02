'use client';

import { type ReactNode } from 'react';
import { useIsRestoring } from '@tanstack/react-query';
import { Headset, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth/session';

/**
 * Full-screen loading screen shown on first paint and on every reload until
 * (a) the SessionProvider has restored the pinned identity from localStorage
 * and (b) the React Query persister has finished rehydrating its cache. Once
 * both are settled, the real app renders in a clean single frame instead of
 * flashing default-role chrome or empty-state placeholders.
 */
export function AppBootGate({ children }: { children: ReactNode }) {
  const { isReady } = useSession();
  const isRestoring = useIsRestoring();

  if (isReady && !isRestoring) return <>{children}</>;

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
