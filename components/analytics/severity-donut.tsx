"use client";

import { Label, Pie, PieChart } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SEVERITIES_BY_PRIORITY, SEVERITY_META } from "@/lib/status/severity";
import type { Severity } from "@/lib/types/domain";

/** Lowercase severity keys double as recharts nameKey + chartConfig keys (drives --color-* vars). */
const chartConfig: ChartConfig = {
  count: { label: "Yêu cầu" },
  ...Object.fromEntries(
    SEVERITIES_BY_PRIORITY.map((s) => [
      SEVERITY_META[s].label.toLowerCase(),
      { label: SEVERITY_META[s].viLabel, color: SEVERITY_META[s].color },
    ]),
  ),
};

/** Donut breakdown of tickets by severity (shadcn Chart + Recharts), colored from the ISO severity palette. */
export function SeverityDonut({
  bySeverity,
}: {
  bySeverity: Record<Severity, number>;
}) {
  const total = SEVERITIES_BY_PRIORITY.reduce(
    (sum, s) => sum + bySeverity[s],
    0,
  );

  const chartData = SEVERITIES_BY_PRIORITY.map((s) => {
    const key = SEVERITY_META[s].label.toLowerCase();
    return { severity: key, count: bySeverity[s], fill: `var(--color-${key})` };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <ChartContainer
        config={chartConfig}
        className="aspect-square h-[200px] w-[200px] shrink-0 [&_.recharts-sector]:outline-none [&_.recharts-sector]:transition-opacity [&_.recharts-sector]:duration-200 [&_.recharts-pie:hover_.recharts-sector]:opacity-45 [&_.recharts-sector:hover]:!opacity-100"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="severity"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            cornerRadius={5}
            strokeWidth={2}
            className="stroke-background"
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  const cx = viewBox.cx ?? 0;
                  const cy = viewBox.cy ?? 0;
                  return (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={cx}
                        y={cy}
                        className="fill-foreground text-3xl font-semibold tabular-nums"
                      >
                        {total}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 22}
                        className="fill-muted-foreground text-xs"
                      >
                        Tổng yêu cầu
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid w-full gap-2.5">
        {SEVERITIES_BY_PRIORITY.map((s) => {
          const value = bySeverity[s];
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          const color = SEVERITY_META[s].color;
          return (
            <li key={s} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="w-20 shrink-0 truncate text-sm sm:w-24">
                {SEVERITY_META[s].viLabel}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums">
                {value}
              </span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
