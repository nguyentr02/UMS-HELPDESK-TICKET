"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface BarRow {
  key: string;
  label: string;
  value: number;
  /** CSS color for the bar. */
  color: string;
}

const chartConfig: ChartConfig = { value: { label: "Yêu cầu" } };

/**
 * Horizontal bar breakdown on the shadcn Chart primitive (Recharts).
 * `sort` orders bars by value desc (dept/category); leave off to preserve order (status lifecycle).
 * Lists longer than `maxRows` scroll within a fixed height instead of growing the card.
 */
export function BarBreakdown({
  rows,
  sort = false,
  rowHeight = 36,
  maxRows = 8,
  emptyText = "Chưa có dữ liệu",
}: {
  rows: BarRow[];
  sort?: boolean;
  rowHeight?: number;
  maxRows?: number;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const data = sort ? [...rows].sort((a, b) => b.value - a.value) : rows;
  const chartHeight = data.length * rowHeight;
  const needsScroll = data.length > maxRows;

  return (
    <div
      className={cn(needsScroll && "overflow-y-auto pr-1")}
      style={needsScroll ? { maxHeight: maxRows * rowHeight } : undefined}
    >
      <ChartContainer
        config={chartConfig}
        className="!aspect-auto w-full"
        style={{ height: chartHeight }}
      >
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 32, top: 4, bottom: 4 }}
          barCategoryGap="22%"
        >
          <XAxis type="number" dataKey="value" hide />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={108}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: string) =>
              v.length > 18 ? `${v.slice(0, 17)}…` : v
            }
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="value" radius={4} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              className="fill-foreground text-xs tabular-nums"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
