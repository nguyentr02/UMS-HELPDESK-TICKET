'use client';

import { ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AccessDenied } from '@/components/ui/access-denied';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterDrawer } from '@/components/ui/filter-drawer';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLE_VI } from '@/lib/auth/nav';
import { canCreateUsers, canViewUsers } from '@/lib/auth/rbac';
import { useRole } from '@/lib/auth/session';
import { useDepartments } from '@/lib/queries/catalog';
import { useUsers } from '@/lib/queries/users';
import type { ListUsersQuery } from '@/lib/types/domain';

import {
  countActiveUserFilters,
  EMPTY_USER_FILTERS,
  UserFilters,
  type UserListFilters,
} from './user-filters';

const PAGE_SIZE = 20;

/**
 * Admin user directory — paged + filterable read-only table. Clicking a row
 * navigates to `/admin/users/[id]` for the detail view. No mutations: per the
 * helpdesk-scope rule, users + departments + faculties are owned by other UMS
 * modules.
 *
 * Filters live in a right-side FilterDrawer to mirror the ticket-list pattern.
 */
export function UserDirectory() {
  const role = useRole();
  const [filters, setFilters] = useState<UserListFilters>(EMPTY_USER_FILTERS);
  const [page, setPage] = useState(1);

  const departments = useDepartments();

  const query: ListUsersQuery = {
    role: filters.role || undefined,
    departmentId: filters.departmentId || undefined,
    search: filters.q.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useUsers(query);

  if (!canViewUsers(role)) return <AccessDenied />;

  const onFilters = (next: UserListFilters) => {
    setFilters(next);
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const items = data?.items ?? [];

  return (
    <section className="flex flex-col gap-5" aria-label="Danh sách người dùng">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách người dùng trong hệ thống. Admin có thể tạo mới; chỉnh sửa / xóa thuộc về module M1 (IAM) của UMS.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {canCreateUsers(role) ? (
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/users/new" aria-label="Tạo người dùng">
              <Plus className="h-4 w-4" aria-hidden />
              Tạo người dùng
            </Link>
          </Button>
        ) : null}
        <FilterDrawer activeCount={countActiveUserFilters(filters)}>
          <UserFilters
            value={filters}
            onChange={onFilters}
            departments={departments.data ?? []}
            bare
          />
        </FilterDrawer>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        empty={<EmptyState title="Không có người dùng" description="Không có người dùng nào khớp với bộ lọc hiện tại." />}
      >
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead className="w-12" aria-label="Chi tiết" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {u.displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_VI[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.department?.name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      aria-label={`Xem chi tiết ${u.displayName}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <ul className="flex flex-col gap-2 md:hidden">
          {items.map((u) => (
            <li key={u.id}>
              <Link
                href={`/admin/users/${u.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5 hover:border-foreground/30 focus-visible:border-foreground/30 focus-visible:outline-none"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{u.displayName}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground">{u.email}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{ROLE_VI[u.role]}</Badge>
                    {u.department ? <span>· {u.department.name}</span> : null}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </DataState>

      {data && totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{data.total} người dùng</p>
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
        </div>
      ) : null}

      {data && totalPages <= 1 && data.total > 0 ? (
        <p className="text-xs text-muted-foreground">{data.total} người dùng</p>
      ) : null}
    </section>
  );
}
