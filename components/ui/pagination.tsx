'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  /** When provided, renders a "Số dòng" page-size selector. */
  onPageSize?: (size: number) => void;
  /** Choices for the page-size selector. Default [10, 20, 50]. */
  pageSizeOptions?: number[];
  /**
   * Noun for the total-count summary, e.g. "yêu cầu". When omitted the
   * "Đang hiển thị X - Y trong tổng số N …" line is hidden (so callers that
   * render their own count don't get a duplicate).
   */
  itemNoun?: string;
}

/**
 * Client-state pagination bar (shadcn Button/Select + lucide chevrons):
 * a left-side range summary plus first/prev/next/last controls, an optional
 * page-size selector, and the current page indicator.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  pageSizeOptions = [10, 20, 50],
  itemNoun,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      {itemNoun ? (
        <p>
          Đang hiển thị <span className="font-medium text-foreground">{from}</span>
          {' - '}
          <span className="font-medium text-foreground">{to}</span> trong tổng số{' '}
          <span className="font-medium text-foreground">{total}</span> {itemNoun}
        </p>
      ) : null}

      <div className="flex items-center gap-3 sm:ml-auto">
        {onPageSize ? (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Số dòng</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[4.5rem]" aria-label="Số dòng mỗi trang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <span className="whitespace-nowrap">
          Trang {page}/{totalPages}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPage(1)}
            aria-label="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPage(totalPages)}
            aria-label="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}