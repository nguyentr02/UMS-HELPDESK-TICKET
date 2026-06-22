'use client';

import Link from 'next/link';
import { useState } from 'react';

import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterDrawer } from '@/components/ui/filter-drawer';
import { Pagination } from '@/components/ui/pagination';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useCategories } from '@/lib/queries/catalog';
import { useTicketPrefetch, useTickets } from '@/lib/queries/tickets';
import type { ExternalStatus, TicketStatus } from '@/lib/types/domain';

import {
  countActiveFilters,
  EMPTY_FILTERS,
  type RequesterFilters,
  TicketFilters,
} from './ticket-filters';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Requesters filter by the 3 external statuses; the API speaks the 4 internal ones.
const EXTERNAL_TO_INTERNAL: Record<ExternalStatus, TicketStatus[]> = {
  Requested: ['Pending', 'Assigned'],
  Processing: ['InProgress'],
  Finished: ['Closed'],
};

/** Requester "My tickets" — external statuses + a filter engine (search/status/severity/category/sort). */
export function TicketList() {
  const [filters, setFilters] = useState<RequesterFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data: categories } = useCategories();
  const prefetchTicket = useTicketPrefetch();
  // Debounce only the free-text search (see HelpdeskQueue for rationale).
  const debouncedQ = useDebouncedValue(filters.q, 300);

  const status = filters.statuses.length
    ? filters.statuses.flatMap((s) => EXTERNAL_TO_INTERNAL[s])
    : undefined;

  const { data, isLoading, isError } = useTickets({
    q: debouncedQ.trim() || undefined,
    status,
    severity: filters.severities.length ? filters.severities : undefined,
    categoryId: filters.categoryId || undefined,
    page,
    pageSize,
    sort: filters.sort,
  });

  const onFilters = (next: RequesterFilters) => {
    setFilters(next);
    setPage(1);
  };

  const onPageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FilterDrawer activeCount={countActiveFilters(filters)}>
          <TicketFilters
            value={filters}
            onChange={onFilters}
            categories={categories ?? []}
            bare
          />
        </FilterDrawer>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data || data.items.length === 0}
        error="Không tải được danh sách. Vui lòng thử lại."
        empty={
          <EmptyState
            title="Không có yêu cầu nào khớp"
            description="Thử bỏ bớt bộ lọc hoặc tạo yêu cầu mới."
          />
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id} onMouseEnter={() => prefetchTicket(t.id)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <Link href={`/tickets/${t.id}`} className="hover:underline">
                        {t.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/tickets/${t.id}`} className="font-medium hover:underline">
                        {t.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={t.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.externalStatus} />
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
                    href={`/tickets/${t.id}`}
                    onMouseEnter={() => prefetchTicket(t.id)}
                    className="block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                      <StatusBadge status={t.externalStatus} />
                    </div>
                    <p className="mt-1 font-medium">{t.title}</p>
                    <div className="mt-2">
                      <SeverityBadge severity={t.severity} />
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
              onPageSize={onPageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemNoun="yêu cầu"
            />
          </>
        ) : null}
      </DataState>
    </div>
  );
}
