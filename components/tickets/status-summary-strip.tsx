'use client';

import type { Role, TicketStatus } from '@/lib/types/domain';
import { INTERNAL_STATUS_VI } from '@/lib/status/status';
import { isRequester } from '@/lib/auth/rbac';
import { useTicketStatusCounts } from '@/lib/queries/tickets';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Card colour per status — solid foreground accent + soft background, same
// hue family as the InternalStatusBadge so the strip and the table badges
// stay legibly related.
const STATUS_STYLE: Record<TicketStatus, { ring: string; text: string; bg: string }> = {
  Pending: { ring: 'bg-amber-500', text: 'text-amber-900', bg: 'bg-amber-50' },
  Assigned: { ring: 'bg-sky-500', text: 'text-sky-900', bg: 'bg-sky-50' },
  InProgress: { ring: 'bg-indigo-500', text: 'text-indigo-900', bg: 'bg-indigo-50' },
  Redirected: { ring: 'bg-purple-500', text: 'text-purple-900', bg: 'bg-purple-50' },
  Closed: { ring: 'bg-emerald-500', text: 'text-emerald-900', bg: 'bg-emerald-50' },
};

// Which statuses each role sees. Requesters never see "Đã giao phòng ban"
// (Assigned) — that's an internal routing detail per the role-permission matrix.
function statusesFor(role: Role): TicketStatus[] {
  if (isRequester(role)) return ['Pending', 'InProgress', 'Redirected', 'Closed'];
  return ['Pending', 'Assigned', 'InProgress', 'Redirected', 'Closed'];
}

/**
 * Counter strip above the tickets table. Pulls caller-scoped status counts
 * from `/tickets/status-counts` and renders a colour-coded card per status
 * the caller is allowed to see.
 */
export function StatusSummaryStrip({ role }: { role: Role }) {
  const { data, isLoading, isError } = useTicketStatusCounts();
  const statuses = statusesFor(role);

  if (isError) return null;

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {statuses.map((s) => (
          <Skeleton key={s} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {statuses.map((s) => {
        const style = STATUS_STYLE[s];
        return (
          <Card
            key={s}
            className={cn(
              'relative overflow-hidden border-border p-4 shadow-sm transition-shadow hover:shadow',
              style.bg,
            )}
          >
            <div className={cn('absolute inset-y-0 left-0 w-1', style.ring)} aria-hidden />
            <div className="flex flex-col gap-1 pl-2">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', style.text)}>
                {INTERNAL_STATUS_VI[s]}
              </span>
              <span className={cn('text-2xl font-bold tabular-nums', style.text)}>
                {data[s]}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
