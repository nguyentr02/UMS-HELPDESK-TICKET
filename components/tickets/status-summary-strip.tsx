'use client';

import type { ExternalStatus, Role, TicketStatus } from '@/lib/types/domain';
import { EXTERNAL_STATUS_VI, INTERNAL_STATUS_VI } from '@/lib/status/status';
import { isRequester } from '@/lib/auth/rbac';
import { useTicketStatusCounts } from '@/lib/queries/tickets';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Card styles mirror the table badges:
//  - Requester pages use StatusBadge (external) — gray / blue / green.
//  - Helpdesk / Staff / Admin pages use InternalStatusBadge — gray / amber /
//    blue / purple / green.
// Same bg-X-100 / text-X-800 the badges use, with a darker bg-X-500 left bar
// so the card reads as "the same colour, bigger."
type Style = { bg: string; text: string; ring: string };

const INT_STYLE: Record<TicketStatus, Style> = {
  Pending: { bg: 'bg-gray-100', text: 'text-gray-800', ring: 'bg-gray-500' },
  Assigned: { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'bg-amber-500' },
  InProgress: { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'bg-blue-500' },
  Redirected: { bg: 'bg-purple-100', text: 'text-purple-800', ring: 'bg-purple-500' },
  Closed: { bg: 'bg-green-100', text: 'text-green-800', ring: 'bg-green-500' },
};

const EXT_STYLE: Record<ExternalStatus, Style> = {
  Requested: { bg: 'bg-gray-100', text: 'text-gray-800', ring: 'bg-gray-500' },
  Processing: { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'bg-blue-500' },
  Finished: { bg: 'bg-green-100', text: 'text-green-800', ring: 'bg-green-500' },
};

interface Bucket {
  key: string;
  label: string;
  count: number;
  style: Style;
}

// Lifecycle-ordered buckets per role. Counts come from /tickets/status-counts
// (internal 5-state); for requesters we collapse to the 3 external buckets the
// same way INTERNAL_TO_EXTERNAL does on the badges.
function bucketsFor(role: Role, c: Record<TicketStatus, number>): Bucket[] {
  if (isRequester(role)) {
    const ext: Record<ExternalStatus, number> = {
      Requested: c.Pending + c.Assigned + c.Redirected,
      Processing: c.InProgress,
      Finished: c.Closed,
    };
    const order: ExternalStatus[] = ['Requested', 'Processing', 'Finished'];
    return order.map((s) => ({
      key: s,
      label: EXTERNAL_STATUS_VI[s],
      count: ext[s],
      style: EXT_STYLE[s],
    }));
  }

  // Agent has no close authority on their own and doesn't action Redirected
  // tickets — show the three buckets they actively work in lifecycle order.
  const internalOrder: TicketStatus[] =
    role === 'HelpdeskAgent'
      ? ['Pending', 'Assigned', 'InProgress']
      : ['Pending', 'Assigned', 'InProgress', 'Closed'];

  return internalOrder.map((s) => ({
    key: s,
    label: INTERNAL_STATUS_VI[s],
    count: c[s],
    style: INT_STYLE[s],
  }));
}

/**
 * Counter strip above the tickets table. Pulls caller-scoped counts from
 * /tickets/status-counts and renders one card per status the role should see,
 * in lifecycle order, colour-matched to the in-table badge for that surface.
 */
export function StatusSummaryStrip({ role }: { role: Role }) {
  const { data, isLoading, isError } = useTicketStatusCounts();

  if (isError) return null;

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const buckets = bucketsFor(role, data);

  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2',
        buckets.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
      )}
    >
      {buckets.map((b) => (
        <Card
          key={b.key}
          className={cn(
            'relative overflow-hidden border-border p-4 shadow-sm transition-shadow hover:shadow',
            b.style.bg,
          )}
        >
          <div className={cn('absolute inset-y-0 left-0 w-1', b.style.ring)} aria-hidden />
          <div className="flex flex-col gap-1 pl-2">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', b.style.text)}>
              {b.label}
            </span>
            <span className={cn('text-2xl font-bold tabular-nums', b.style.text)}>
              {b.count}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
