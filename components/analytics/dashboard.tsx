"use client";

import { AccessDenied } from "@/components/ui/access-denied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { canViewDashboard } from "@/lib/auth/rbac";
import { useRole } from "@/lib/auth/session";
import { useAnalyticsSummary } from "@/lib/queries/analytics";
import {
  ALL_STATUSES,
  INTERNAL_STATUS_VI,
  STATUS_COLOR,
} from "@/lib/status/status";

import { BarBreakdown } from "./bar-breakdown";
import { RankedBars } from "./ranked-bars";
import { SeverityDonut } from "./severity-donut";
import { StatCard } from "./stat-card";

/** S10 — module dashboard (Lead/Admin only): headline counts + severity/status/dept/category breakdowns. */
export function Dashboard() {
  const role = useRole();
  const { data, isLoading, isError, refetch } = useAnalyticsSummary();

  if (!canViewDashboard(role)) return <AccessDenied />;

  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-busy="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm font-medium text-destructive">
          Không tải được số liệu. Vui lòng thử lại.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng yêu cầu" value={data.total} />
        <StatCard label="Đang mở" value={data.open} />
        <StatCard label="Đã đóng" value={data.closed} />
        <StatCard
          label="TB xử lý (ngày)"
          value={
            data.avgHandlingDays == null ? "—" : data.avgHandlingDays.toFixed(2)
          }
        />
      </div>

      {data.total === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu"
          description="Chưa có yêu cầu nào để thống kê."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo mức độ</CardTitle>
            </CardHeader>
            <CardContent>
              <SeverityDonut bySeverity={data.bySeverity} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <BarBreakdown
                rows={ALL_STATUSES.map((s) => ({
                  key: s,
                  label: INTERNAL_STATUS_VI[s],
                  value: data.byStatus[s],
                  color: STATUS_COLOR[s],
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo phòng ban</CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBars
                indicatorClassName="[&>div]:bg-[hsl(var(--chart-1))]"
                rows={data.byDepartment.map((d) => ({
                  key: d.departmentId,
                  label: d.name,
                  value: d.count,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBars
                columns={2}
                indicatorClassName="[&>div]:bg-[hsl(var(--chart-2))]"
                rows={data.byCategory.map((c) => ({
                  key: c.categoryId,
                  label: c.name,
                  value: c.count,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
