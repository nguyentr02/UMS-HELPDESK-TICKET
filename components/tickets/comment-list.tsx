'use client';

import { useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useTicketComments } from '@/lib/queries/tickets';

import { AttachmentList } from './attachment-list';

/** Newest-first; show this many, with a "Xem thêm" to reveal the rest. */
const INITIAL_VISIBLE = 5;

/**
 * Comment thread for a ticket, newest → oldest. Shows the 5 most recent by
 * default; if there are more, a "Xem thêm" toggle reveals the older ones (and
 * collapses back). One card per comment: author, timestamp, body, attachments.
 * Empty state and loading skeleton are handled inline.
 */
export function CommentList({ ticketId }: { ticketId: string }) {
  const { data, isLoading, error } = useTicketComments(ticketId);
  const [expanded, setExpanded] = useState(false);

  // BE returns comments oldest-first; sort newest-first for display. Memoized
  // so the array identity is stable across re-renders (e.g. toggling expand).
  const sorted = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">Không tải được lịch sử bình luận.</p>
    );
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>;
  }

  const fmt = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sorted.length - INITIAL_VISIBLE;

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {visible.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-1.5 rounded-md border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{c.author.displayName}</span>
              <time dateTime={c.createdAt}>{fmt.format(new Date(c.createdAt))}</time>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
            {c.attachments.length > 0 ? (
              <div className="pt-1">
                <AttachmentList attachments={c.attachments} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start rounded-md px-1 py-0.5 text-sm font-medium text-red-700 outline-none transition-colors hover:text-red-800 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? 'Thu gọn' : `Xem thêm (${hiddenCount} bình luận cũ hơn)`}
        </button>
      ) : null}
    </div>
  );
}
