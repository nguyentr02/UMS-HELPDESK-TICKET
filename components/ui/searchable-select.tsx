'use client';

import { useId, useMemo, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A filter input + native `<select>` — a "searchable picker" that's fully
 * jsdom-testable (unlike a Radix Combobox). Used for agent / department pickers.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  searchLabel = 'Tìm kiếm',
  placeholder = 'Tìm…',
  emptyOptionLabel = '— Chọn —',
  disabled,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  searchLabel?: string;
  placeholder?: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const selectId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium">
        {label}
      </label>
      <input
        type="search"
        aria-label={searchLabel}
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{emptyOptionLabel}</option>
        {filtered.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
