'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FilterSelect } from '@/components/ui/filter-bar';
import { Input } from '@/components/ui/input';
import { ROLE_VI } from '@/lib/auth/nav';
import type { Department, Role } from '@/lib/types/domain';

const ROLE_OPTIONS: Role[] = ['SV', 'GV', 'NV', 'HelpdeskAgent', 'HelpdeskLead', 'DeptStaff', 'Admin'];

export interface UserListFilters {
  q: string;
  role: Role | '';
  departmentId: string;
}

export const EMPTY_USER_FILTERS: UserListFilters = {
  q: '',
  role: '',
  departmentId: '',
};

function isActive(f: UserListFilters): boolean {
  return f.q.trim() !== '' || f.role !== '' || f.departmentId !== '';
}

export function countActiveUserFilters(f: UserListFilters): number {
  let n = 0;
  if (f.q.trim() !== '') n += 1;
  if (f.role !== '') n += 1;
  if (f.departmentId !== '') n += 1;
  return n;
}

/**
 * Admin user-directory filters — search + role + department. Controlled.
 *
 * `bare` strips the FilterPanel chrome and switches to a vertical stack for
 * use inside the FilterDrawer (same convention as TicketFilters).
 */
export function UserFilters({
  value,
  onChange,
  departments,
  bare = false,
}: {
  value: UserListFilters;
  onChange: (next: UserListFilters) => void;
  departments: Department[];
  bare?: boolean;
}) {
  const searchInput = (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        aria-label="Tìm theo tên hoặc email"
        placeholder="Tìm theo tên hoặc email…"
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        className="bg-background pl-8"
      />
    </div>
  );

  const roleSelect = (
    <FilterSelect
      label="Vai trò"
      ariaLabel="Lọc theo vai trò"
      value={value.role}
      onChange={(role) => onChange({ ...value, role: role as Role | '' })}
      allLabel="Tất cả"
      options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_VI[r] }))}
      className={bare ? 'w-full' : undefined}
    />
  );

  const deptSelect = (
    <FilterSelect
      label="Phòng ban"
      ariaLabel="Lọc theo phòng ban"
      value={value.departmentId}
      onChange={(departmentId) => onChange({ ...value, departmentId })}
      allLabel="Tất cả"
      options={departments.map((d) => ({ value: d.id, label: d.name }))}
      className={bare ? 'w-full' : 'w-56'}
    />
  );

  const clearButton = isActive(value) ? (
    <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_USER_FILTERS)}>
      <X className="mr-1 h-4 w-4" aria-hidden />
      Xóa lọc
    </Button>
  ) : null;

  if (bare) {
    return (
      <div className="flex flex-col gap-5 p-4">
        {searchInput}
        {roleSelect}
        {deptSelect}
        {clearButton ? <div className="pt-2">{clearButton}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="sm:min-w-64 sm:flex-1">{searchInput}</div>
      {roleSelect}
      {deptSelect}
      {clearButton ? <div className="ml-auto self-end">{clearButton}</div> : null}
    </div>
  );
}
