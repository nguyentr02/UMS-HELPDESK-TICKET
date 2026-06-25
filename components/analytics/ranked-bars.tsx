"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface RankedRow {
  key: string;
  label: string;
  value: number;
}

/**
 * Ranked breakdown for long-label lists (departments, categories): each name gets its own
 * full-width line with the count, and a shadcn Progress bar (relative to the max) underneath.
 * Avoids the cramped, truncated axis labels of a horizontal bar chart. Sorted desc; scrolls past `maxRows`.
 */
export function RankedBars({
  rows,
  indicatorClassName,
  columns = 1,
  maxRows = 7,
  emptyText = "Chưa có dữ liệu",
}: {
  rows: RankedRow[];
  /** Tailwind override for the bar fill, e.g. '[&>div]:bg-[hsl(var(--chart-1))]'. */
  indicatorClassName: string;
  /** Lay rows out across N columns (2 fits many categories without scrolling). */
  columns?: 1 | 2;
  maxRows?: number;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const data = [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...data.map((d) => d.value));
  const visualRows = Math.ceil(data.length / columns);
  const needsScroll = visualRows > maxRows;

  return (
    <ul
      className={cn(
        "grid gap-x-6 gap-y-3",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        needsScroll && "overflow-y-auto pr-1.5",
      )}
      style={needsScroll ? { maxHeight: maxRows * 52 } : undefined}
    >
      {data.map((d) => (
        <li key={d.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{d.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{d.value}</span>
          </div>
          <Progress
            value={(d.value / max) * 100}
            className={cn("h-2", indicatorClassName)}
          />
        </li>
      ))}
    </ul>
  );
}
