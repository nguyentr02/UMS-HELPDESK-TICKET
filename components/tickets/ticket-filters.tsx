'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FilterChipGroup, FilterPanel, FilterRow, FilterSelect } from '@/components/ui/filter-bar';
import { Input } from '@/components/ui/input';
import { SEVERITIES_BY_PRIORITY, SEVERITY_META } from '@/lib/status/severity';
import { EXTERNAL_STATUS_VI } from '@/lib/status/status';
import type { Category, ExternalStatus, Severity } from '@/lib/types/domain';

export interface RequesterFilters {
  q: string;
  statuses: ExternalStatus[];
  severities: Severity[];
  categoryId: string;
  sort: string;
}

export const EMPTY_FILTERS: RequesterFilters = {
  q: '',
  statuses: [],
  severities: [],
  categoryId: '',
  sort: '-createdAt',
};

const EXTERNAL_STATUS_ORDER: ExternalStatus[] = ['Requested', 'Processing', 'Finished'];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: 'createdAt', label: 'Cũ nhất' },
  { value: '-severity', label: 'Mức độ: cao → thấp' },
  { value: 'severity', label: 'Mức độ: thấp → cao' },
];

function isActive(f: RequesterFilters): boolean {
  return (
    f.q.trim() !== '' ||
    f.statuses.length > 0 ||
    f.severities.length > 0 ||
    f.categoryId !== '' ||
    f.sort !== EMPTY_FILTERS.sort
  );
}

/** Number of non-default filter facets in use — surfaced on the drawer trigger badge. */
export function countActiveFilters(f: RequesterFilters): number {
  let n = 0;
  if (f.q.trim() !== '') n += 1;
  if (f.statuses.length > 0) n += 1;
  if (f.severities.length > 0) n += 1;
  if (f.categoryId !== '') n += 1;
  if (f.sort !== EMPTY_FILTERS.sort) n += 1;
  return n;
}

/**
 * Requester "My tickets" filter engine — search + external-status / severity
 * chips + category + sort, built from shadcn primitives. Controlled.
 *
 * `bare` strips the FilterPanel chrome and switches to a vertical stack for
 * use inside the FilterDrawer.
 */
export function TicketFilters({
  value,
  onChange,
  categories,
  bare = false,
}: {
  value: RequesterFilters;
  onChange: (next: RequesterFilters) => void;
  categories: Category[];
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
      options={EXTERNAL_STATUS_ORDER.map((s) => ({ value: s, label: EXTERNAL_STATUS_VI[s] }))}
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
    <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
      <X className="mr-1 h-4 w-4" aria-hidden />
      Xóa lọc
    </Button>
  ) : null;

  if (bare) {
    return (
      <div className="flex flex-col gap-5 p-4">
        {searchInput}
        {categorySelect}
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
    <FilterPanel label="Bộ lọc yêu cầu">
      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="sm:min-w-64 sm:flex-1">{searchInput}</div>
        {categorySelect}
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
