import { Headset, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Full-screen branded loading state. Reused by the boot gate (while the
 * session / persister rehydrate) and by the landing → app transition (while
 * we hold the spinner between "Bắt đầu" and the role-appropriate home).
 *
 * `exiting` triggers a scale-up + fade-out on the inner content — the
 * landing page flips it on for the last ~500 ms of its 2 s window so the
 * brand mark visibly "zooms into the app" before the navigation fires.
 * Other callers (boot gate, identity switch) leave it `false` and the
 * splash disappears instantly.
 */
export function LoadingSplash({ exiting = false }: { exiting?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          'flex flex-col items-center gap-4 transition-all duration-500 ease-in',
          exiting && 'scale-150 opacity-0',
        )}
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
    </div>
  );
}
