import { Headset, Loader2 } from 'lucide-react';

/**
 * Full-screen branded loading state. Reused by the boot gate (while the
 * session / persister rehydrate) and by the landing → app transition (while
 * we hold the spinner between "Bắt đầu" and `/analytics`).
 */
export function LoadingSplash() {
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
