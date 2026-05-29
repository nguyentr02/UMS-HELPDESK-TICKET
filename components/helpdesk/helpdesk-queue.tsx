'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTickets } from '@/lib/queries/tickets';
import { useAgents } from '@/lib/queries/catalog';
import { useRole } from '@/lib/auth/session';
import { canViewQueue } from '@/lib/auth/rbac';
import { ALL_STATUSES, INTERNAL_STATUS_VI } from '@/lib/status/status';
import { SEVERITIES_BY_PRIORITY, SEVERITY_META } from '@/lib/status/severity';
import type { Severity, TicketStatus } from '@/lib/types/domain';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { InternalStatusBadge } from '@/components/ui/internal-status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { AccessDenied } from '@/components/ui/access-denied';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 20;
const SELECT_CLASS =
  'rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
type StatusFilter = 'all' | 'open' | TicketStatus;

/** Helpdesk intake queue (S3/S4 entry point): status / severity / assignee filters. */
export function HelpdeskQueue() {
  const role = useRole();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [severities, setSeverities] = useState<Severity[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const { data: agents } = useAgents();

  const status =
    statusFilter === 'all' ? undefined : statusFilter === 'open' ? 'open' : [statusFilter];
  const { data, isLoading, isError } = useTickets({
    status,
    severity: severities.length ? severities : undefined,
    assigneeId: assigneeId || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: '-createdAt',
  });

  const toggleSeverity = (s: Severity) => {
    setPage(1);
    setSeverities((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  if (!canViewQueue(role)) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Trạng thái</span>
          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className={SELECT_CLASS}
          >
            <option value="all">Tất cả</option>
            <option value="open">Chưa đóng</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INTERNAL_STATUS_VI[s]}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="font-medium">Mức độ</legend>
          <div className="flex flex-wrap gap-3 pt-1">
            {SEVERITIES_BY_PRIORITY.map((s) => (
              <label key={s} className="flex items-center gap-1.5">
                <Checkbox
                  checked={severities.includes(s)}
                  onCheckedChange={() => toggleSeverity(s)}
                  aria-label={SEVERITY_META[s].label}
                />
                <span aria-hidden>{SEVERITY_META[s].emoji}</span>
                {SEVERITY_META[s].label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nhân viên</span>
          <select
            aria-label="Lọc theo nhân viên"
            value={assigneeId}
            onChange={(e) => {
              setAssigneeId(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
          >
            <option value="">Tất cả</option>
            {(agents ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data || data.items.length === 0}
        error="Không tải được hàng đợi. Vui lòng thử lại."
        empty={
          <EmptyState title="Không có yêu cầu" description="Không có yêu cầu nào khớp bộ lọc hiện tại." />
        }
      >
        {data ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Phụ trách</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <Link href={`/helpdesk/tickets/${t.id}`} className="hover:underline">
                        {t.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/helpdesk/tickets/${t.id}`} className="font-medium hover:underline">
                        {t.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={t.severity} />
                    </TableCell>
                    <TableCell>
                      <InternalStatusBadge status={t.internalStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.helpdeskAssignee ? t.helpdeskAssignee.displayName : 'Chưa gán'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={data.page.page}
              pageSize={data.page.pageSize}
              total={data.page.total}
              onPage={setPage}
            />
          </>
        ) : null}
      </DataState>
    </div>
  );
}
