'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/session';

/** Explicit denial view for RBAC-gated areas (S2 — never a blank screen). */
export function AccessDenied({
  message = 'Bạn không có quyền truy cập khu vực này.',
}: {
  message?: string;
}) {
  // The session boots with the SSR-safe default identity (SV) and only swaps
  // to the real pinned identity once the localStorage-restore effect runs.
  // Render a skeleton instead of denial during that window, otherwise a
  // HelpdeskLead reloading /helpdesk/queue sees "no permission" for a tick.
  const { isReady } = useSession();
  if (!isReady) {
    return (
      <div className="flex flex-col gap-2 p-6" aria-busy="true">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertTitle>Không có quyền</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
