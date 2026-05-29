'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Shared building blocks for the persona filter bars (requester list + helpdesk/staff
// queues) so every surface gets the same shadcn look: a filled, clearly-bordered panel
// with row-divided sections, shadcn ToggleGroup chips, and shadcn Select dropdowns.

const ALL = '__all__'; // Radix Select forbids empty-string item values; sentinel for "Tất cả".

const CHIP_CLASS =
  'rounded-full border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm hover:bg-accent hover:text-foreground data-[state=on]:border-red-600 data-[state=on]:bg-red-600 data-[state=on]:text-white';

export function FilterPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="divide-y divide-border rounded-lg border-2 border-border bg-muted/40 shadow-sm"
    >
      {children}
    </section>
  );
}

/** A divided section: a fixed-width bold label + its controls — keeps groups visually distinct. */
export function FilterRow({
  label,
  groupLabel,
  children,
}: {
  label: string;
  groupLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5" aria-label={groupLabel}>
      <span className="w-24 shrink-0 text-sm font-semibold text-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Multi-select chips on shadcn ToggleGroup (jsdom-safe — items are buttons with aria-pressed). */
export function FilterChipGroup<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T[];
  onChange: (value: T[]) => void;
  options: { value: T; label: ReactNode; ariaLabel?: string }[];
  ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="multiple"
      aria-label={ariaLabel}
      value={value}
      onValueChange={(v) => onChange(v as T[])}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} aria-label={o.ariaLabel} className={CHIP_CLASS}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * A labelled shadcn Select. When `allLabel` is set, an "all" item maps to `''`
 * (so callers keep using empty string for "no filter").
 */
export function FilterSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  allLabel,
  placeholder,
  className,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <Select value={value === '' ? ALL : value} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
        <SelectTrigger aria-label={ariaLabel} className={cn('h-9 w-44', className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allLabel != null ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
