import type { ExternalStatus } from '@/lib/types/domain';
import { EXTERNAL_STATUS_VI } from '@/lib/status/status';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const COLOR: Record<ExternalStatus, string> = {
  Requested: 'bg-gray-100 text-gray-800',
  Processing: 'bg-blue-100 text-blue-800',
  Finished: 'bg-green-100 text-green-800',
};

/** Requester-facing status pill (external status, Vietnamese label). */
export function StatusBadge({ status }: { status: ExternalStatus }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', COLOR[status])}>
      {EXTERNAL_STATUS_VI[status]}
    </Badge>
  );
}
