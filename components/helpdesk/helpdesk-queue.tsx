'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTickets } from '@/lib/queries/tickets';
import { useAgents, useCategories } from '@/lib/queries/catalog';
import { useRole } from '@/lib/auth/session';
import { canViewQueue } from '@/lib/auth/rbac';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { InternalStatusBadge } from '@/components/ui/internal-status-badge';
import { Pagination } from '@/components/ui/pagination';
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
import { FilterDrawer } from '@/components/ui/filter-drawer';
import {
  QueueFilters,
  DEFAULT_QUEUE_FILTERS,
  countActiveQueueFilters,
  type QueueFiltersState,
} from '@/components/tickets/queue-filters';

const PAGE_SIZE = 20;

/** Helpdesk intake queue (S3/S4 entry point): search / status / severity / category / assignee filters. */
export function HelpdeskQueue() {
  const role = useRole();
  const [filters, setFilters] = useState<QueueFiltersState>(DEFAULT_QUEUE_FILTERS);
  const [page, setPage] = useState(1);
  const { data: agents } = useAgents();
  const { data: categories } = useCategories();

  const { data, isLoading, isError } = useTickets({
    q: filters.q.trim() || undefined,
    status: filters.statuses.length ? filters.statuses : undefined,
    severity: filters.severities.length ? filters.severities : undefined,
    categoryId: filters.categoryId || undefined,
    assigneeId: filters.assigneeId || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: filters.sort,
  });

  const onFilters = (next: QueueFiltersState) => {
    setFilters(next);
    setPage(1);
  };

  if (!canViewQueue(role)) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FilterDrawer activeCount={countActiveQueueFilters(filters)}>
          <QueueFilters
            value={filters}
            onChange={onFilters}
            categories={categories ?? []}
            agents={agents ?? []}
            bare
          />
        </FilterDrawer>
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
            {/* Desktop: table */}
            <Table className="hidden md:table">
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

            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {data.items.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/helpdesk/tickets/${t.id}`}
                    className="block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                      <InternalStatusBadge status={t.internalStatus} />
                    </div>
                    <p className="mt-1 font-medium">{t.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <SeverityBadge severity={t.severity} />
                      <span className="text-sm text-muted-foreground">
                        {t.helpdeskAssignee ? t.helpdeskAssignee.displayName : 'Chưa gán'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

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
