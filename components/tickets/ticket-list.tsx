'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTickets } from '@/lib/queries/tickets';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 20;

/** Requester "My tickets" — external statuses only, with an open-only filter. */
export function TicketList() {
  const [page, setPage] = useState(1);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const { data, isLoading, isError } = useTickets({
    status: onlyOpen ? 'open' : undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: '-createdAt',
  });

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={onlyOpen}
          onCheckedChange={(v) => {
            setOnlyOpen(v === true);
            setPage(1);
          }}
          aria-label="Chỉ hiển thị chưa hoàn tất"
        />
        Chỉ hiển thị chưa hoàn tất
      </label>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data || data.items.length === 0}
        error="Không tải được danh sách. Vui lòng thử lại."
        empty={
          <EmptyState title="Chưa có yêu cầu nào" description="Bạn chưa tạo yêu cầu hỗ trợ nào." />
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id}>
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
