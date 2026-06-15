'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

/** shadcn Combobox (Popover + Command) — searchable single-select. */
export function Combobox({
  options,
  value,
  onChange,
  label,
  searchLabel = 'Tìm kiếm',
  placeholder = 'Chọn…',
  emptyText = 'Không có kết quả.',
  disabled,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  searchLabel?: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            disabled={disabled}
            className="justify-between font-normal"
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput aria-label={searchLabel} placeholder={searchLabel} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === o.value ? 'opacity-100' : 'opacity-0')} />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
