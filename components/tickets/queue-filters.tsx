'use client';

import { Search, X } from 'lucide-react';
import type { Category, Severity, TicketStatus, UserRef } from '@/lib/types/domain';
import { ALL_STATUSES, INTERNAL_STATUS_VI, OPEN_STATUSES } from '@/lib/status/status';
import { SEVERITIES_BY_PRIORITY, SEVERITY_META } from '@/lib/status/severity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterChipGroup, FilterPanel, FilterRow, FilterSelect } from '@/components/ui/filter-bar';

export interface QueueFiltersState {
  q: string;
  statuses: TicketStatus[];
  severities: Severity[];
  categoryId: string;
  assigneeId: string;
  sort: string;
}

// Queues default to the open (non-Closed) statuses — the active work view.
export const DEFAULT_QUEUE_FILTERS: QueueFiltersState = {
  q: '',
  statuses: [...OPEN_STATUSES],
  severities: [],
  categoryId: '',
  assigneeId: '',
  sort: '-createdAt',
};

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: 'createdAt', label: 'Cũ nhất' },
  { value: '-severity', label: 'Mức độ: cao → thấp' },
  { value: 'severity', label: 'Mức độ: thấp → cao' },
];

const sameStatusSet = (a: TicketStatus[], b: TicketStatus[]) =>
  a.length === b.length && a.every((s) => b.includes(s));

function isActive(f: QueueFiltersState): boolean {
  return (
    f.q.trim() !== '' ||
    f.severities.length > 0 ||
    f.categoryId !== '' ||
    f.assigneeId !== '' ||
    f.sort !== DEFAULT_QUEUE_FILTERS.sort ||
    !sameStatusSet(f.statuses, DEFAULT_QUEUE_FILTERS.statuses)
  );
}

/** Number of non-default filter facets in use — surfaced on the drawer trigger badge. */
export function countActiveQueueFilters(f: QueueFiltersState): number {
  let n = 0;
  if (f.q.trim() !== '') n += 1;
  if (!sameStatusSet(f.statuses, DEFAULT_QUEUE_FILTERS.statuses)) n += 1;
  if (f.severities.length > 0) n += 1;
  if (f.categoryId !== '') n += 1;
  if (f.assigneeId !== '') n += 1;
  if (f.sort !== DEFAULT_QUEUE_FILTERS.sort) n += 1;
  return n;
}

/**
 * Helpdesk / Dept-Staff queue filter engine — search + internal-status / severity
 * chips + category + sort, plus an assignee select when `agents` is provided
 * (Helpdesk only). Built from the same shadcn primitives as the requester filter.
 *
 * `bare` strips the FilterPanel chrome and switches to a vertical stack for
 * use inside the FilterDrawer.
 */
export function QueueFilters({
  value,
  onChange,
  categories,
  agents,
  bare = false,
}: {
  value: QueueFiltersState;
  onChange: (next: QueueFiltersState) => void;
  categories: Category[];
  agents?: UserRef[];
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
        aria-label="Tìm theo tiêu đề hoặc mô tả"
        placeholder="Tìm theo tiêu đề hoặc mô tả…"
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        className="bg-background pl-8"
      />
    </div>
  );

  const categorySelect = (
    <FilterSelect
      label="Danh mục"
      ariaLabel="Lọc theo danh mục"
      value={value.categoryId}
      onChange={(categoryId) => onChange({ ...value, categoryId })}
      allLabel="Tất cả"
      options={categories.map((c) => ({ value: c.id, label: c.name }))}
      className={bare ? 'w-full' : undefined}
    />
  );

  const assigneeSelect = agents ? (
    <FilterSelect
      label="Nhân viên"
      ariaLabel="Lọc theo nhân viên"
      value={value.assigneeId}
      onChange={(assigneeId) => onChange({ ...value, assigneeId })}
      allLabel="Tất cả"
      options={agents.map((a) => ({ value: a.id, label: a.displayName }))}
      className={bare ? 'w-full' : undefined}
    />
  ) : null;

  const sortSelect = (
    <FilterSelect
      label="Sắp xếp"
      ariaLabel="Sắp xếp"
      value={value.sort}
      onChange={(sort) => onChange({ ...value, sort })}
      options={SORT_OPTIONS}
      className={bare ? 'w-full' : 'w-48'}
    />
  );

  const statusChips = (
    <FilterChipGroup
      ariaLabel="Lọc theo trạng thái"
      value={value.statuses}
      onChange={(statuses) => onChange({ ...value, statuses })}
      options={ALL_STATUSES.map((s) => ({ value: s, label: INTERNAL_STATUS_VI[s] }))}
    />
  );

  const severityChips = (
    <FilterChipGroup
      ariaLabel="Lọc theo mức độ"
      value={value.severities}
      onChange={(severities) => onChange({ ...value, severities })}
      options={SEVERITIES_BY_PRIORITY.map((s) => ({
        value: s,
        ariaLabel: SEVERITY_META[s].label,
        label: (
          <>
            <span aria-hidden>{SEVERITY_META[s].emoji}</span> {SEVERITY_META[s].label}
          </>
        ),
      }))}
    />
  );

  const clearButton = isActive(value) ? (
    <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_QUEUE_FILTERS)}>
      <X className="mr-1 h-4 w-4" aria-hidden />
      Xóa lọc
    </Button>
  ) : null;

  if (bare) {
    return (
      <div className="flex flex-col gap-5 p-4">
        {searchInput}
        {categorySelect}
        {assigneeSelect}
        {sortSelect}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Trạng thái</span>
          {statusChips}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Mức độ</span>
          {severityChips}
        </div>
        {clearButton ? <div className="pt-2">{clearButton}</div> : null}
      </div>
    );
  }

  return (
    <FilterPanel label="Bộ lọc hàng đợi">
      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="sm:min-w-64 sm:flex-1">{searchInput}</div>
        {categorySelect}
        {assigneeSelect}
        {sortSelect}
      </div>

      <FilterRow label="Trạng thái" groupLabel="Lọc theo trạng thái">
        {statusChips}
      </FilterRow>

      <FilterRow label="Mức độ" groupLabel="Lọc theo mức độ">
        {severityChips}
        {clearButton ? <div className="ml-auto">{clearButton}</div> : null}
      </FilterRow>
    </FilterPanel>
  );
}
