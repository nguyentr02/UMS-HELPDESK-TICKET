'use client';

import { Search, X } from 'lucide-react';
import type { Category, ExternalStatus, Severity } from '@/lib/types/domain';
import { EXTERNAL_STATUS_VI } from '@/lib/status/status';
import { SEVERITIES_BY_PRIORITY, SEVERITY_META } from '@/lib/status/severity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterChipGroup, FilterPanel, FilterRow, FilterSelect } from '@/components/ui/filter-bar';

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

/**
 * Requester "My tickets" filter engine — search + external-status / severity
 * chips + category + sort, built from shadcn primitives. Controlled.
 */
export function TicketFilters({
  value,
  onChange,
  categories,
}: {
  value: RequesterFilters;
  onChange: (next: RequesterFilters) => void;
  categories: Category[];
}) {
  return (
    <FilterPanel label="Bộ lọc yêu cầu">
      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative sm:min-w-64 sm:flex-1">
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

        <FilterSelect
          label="Danh mục"
          ariaLabel="Lọc theo danh mục"
          value={value.categoryId}
          onChange={(categoryId) => onChange({ ...value, categoryId })}
          allLabel="Tất cả"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />

        <FilterSelect
          label="Sắp xếp"
          ariaLabel="Sắp xếp"
          value={value.sort}
          onChange={(sort) => onChange({ ...value, sort })}
          options={SORT_OPTIONS}
          className="w-48"
        />
      </div>

      <FilterRow label="Trạng thái" groupLabel="Lọc theo trạng thái">
        <FilterChipGroup
          ariaLabel="Lọc theo trạng thái"
          value={value.statuses}
          onChange={(statuses) => onChange({ ...value, statuses })}
          options={EXTERNAL_STATUS_ORDER.map((s) => ({ value: s, label: EXTERNAL_STATUS_VI[s] }))}
        />
      </FilterRow>

      <FilterRow label="Mức độ" groupLabel="Lọc theo mức độ">
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
        {isActive(value) ? (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onChange(EMPTY_FILTERS)}>
            <X className="mr-1 h-4 w-4" aria-hidden />
            Xóa lọc
          </Button>
        ) : null}
      </FilterRow>
    </FilterPanel>
  );
}
