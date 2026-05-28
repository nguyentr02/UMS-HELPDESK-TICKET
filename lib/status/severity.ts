import type { Severity } from '@/lib/types/domain';

export interface SeverityMeta {
  label: string;
  viLabel: string;
  emoji: string;
  /** Tailwind background token from tailwind.config.ts (severity palette). */
  colorClass: string;
  /** Sort order: Critical (0) → Low (3). */
  order: number;
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  Critical: { label: 'Critical', viLabel: 'Nghiêm trọng', emoji: '🔴', colorClass: 'bg-severity-critical', order: 0 },
  High: { label: 'High', viLabel: 'Cao', emoji: '🟠', colorClass: 'bg-severity-high', order: 1 },
  Medium: { label: 'Medium', viLabel: 'Trung bình', emoji: '🟡', colorClass: 'bg-severity-medium', order: 2 },
  Low: { label: 'Low', viLabel: 'Thấp', emoji: '🟢', colorClass: 'bg-severity-low', order: 3 },
};

export const SEVERITIES_BY_PRIORITY: Severity[] = (Object.keys(SEVERITY_META) as Severity[]).sort(
  (a, b) => SEVERITY_META[a].order - SEVERITY_META[b].order,
);
