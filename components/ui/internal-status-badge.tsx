import { Badge } from '@/components/ui/badge';
import { INTERNAL_STATUS_VI } from '@/lib/status/status';
import type { TicketStatus } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const COLOR: Record<TicketStatus, string> = {
  Pending: 'bg-gray-100 text-gray-800',
  Assigned: 'bg-amber-100 text-amber-800',
  InProgress: 'bg-blue-100 text-blue-800',
  CloseRequested: 'bg-purple-100 text-purple-800',
  RedirectRequested: 'bg-orange-100 text-orange-800',
  Closed: 'bg-green-100 text-green-800',
};

/** Internal (6-state) status pill — Helpdesk/Staff/Admin views only. */
export function InternalStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', COLOR[status])}>
      {INTERNAL_STATUS_VI[status]}
    </Badge>
  );
}
