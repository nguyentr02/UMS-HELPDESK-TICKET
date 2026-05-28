import type { Severity } from '@/lib/types/domain';
import { SEVERITY_META } from '@/lib/status/severity';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Soft-tinted badges (UI design: docs/ui-design/helpdesk-console.html), aligned to the
// emoji colours for the three-channel rule (color + emoji + label).
const COLOR: Record<Severity, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
};

/** Severity pill — three-channel (color + emoji + label), never color-only. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 border-transparent', COLOR[severity])}
      aria-label={`Mức độ ${meta.viLabel}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </Badge>
  );
}
