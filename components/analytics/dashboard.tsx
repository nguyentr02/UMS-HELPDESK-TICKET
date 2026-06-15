'use client';

import { AccessDenied } from '@/components/ui/access-denied';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { canViewDashboard } from '@/lib/auth/rbac';
import { useRole } from '@/lib/auth/session';
import { useAnalyticsSummary } from '@/lib/queries/analytics';
import { SEVERITIES_BY_PRIORITY, SEVERITY_META } from '@/lib/status/severity';
import { ALL_STATUSES, INTERNAL_STATUS_VI } from '@/lib/status/status';
import { cn } from '@/lib/utils';

import { StatCard } from './stat-card';

function Bar({
  label,
  value,
  max,
  colorClass = 'bg-red-500',
}: {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
        <div className={cn('h-full rounded', colorClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums">{value}</span>
    </div>
  );
}

/** S10 — module dashboard (Lead/Admin only): headline counts + severity/status/dept/category breakdowns. */
export function Dashboard() {
  const role = useRole();
  const { data, isLoading, isError, refetch } = useAnalyticsSummary();

  if (!canViewDashboard(role)) return <AccessDenied />;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
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

  const maxSeverity = Math.max(1, ...SEVERITIES_BY_PRIORITY.map((s) => data.bySeverity[s]));
  const maxStatus = Math.max(1, ...ALL_STATUSES.map((s) => data.byStatus[s]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng yêu cầu" value={data.total} />
        <StatCard label="Đang mở" value={data.open} />
        <StatCard label="Đã đóng" value={data.closed} />
        <StatCard
          label="TB xử lý (ngày)"
          value={data.avgHandlingDays == null ? '—' : data.avgHandlingDays.toFixed(2)}
        />
      </div>

      {data.total === 0 ? (
        <EmptyState title="Chưa có dữ liệu" description="Chưa có yêu cầu nào để thống kê." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo mức độ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {SEVERITIES_BY_PRIORITY.map((s) => (
                <Bar
                  key={s}
                  label={`${SEVERITY_META[s].emoji} ${SEVERITY_META[s].viLabel}`}
                  value={data.bySeverity[s]}
                  max={maxSeverity}
                  colorClass={SEVERITY_META[s].colorClass}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ALL_STATUSES.map((s) => (
                <Bar key={s} label={INTERNAL_STATUS_VI[s]} value={data.byStatus[s]} max={maxStatus} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo phòng ban</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {data.byDepartment.map((d) => (
                <div key={d.departmentId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{d.name}</span>
                  <span className="tabular-nums text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo danh mục</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {data.byCategory.map((c) => (
                <div key={c.categoryId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{c.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
