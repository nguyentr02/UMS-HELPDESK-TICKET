'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useTicketComments } from '@/lib/queries/tickets';

import { AttachmentList } from './attachment-list';

/**
 * Chronological comment thread for a ticket. Renders one card per comment with
 * the author, timestamp, body, and any attached files. Empty state and loading
 * skeleton are handled inline so the surrounding "Bình luận" section can drop
 * this component in without extra branching.
 */
export function CommentList({ ticketId }: { ticketId: string }) {
  const { data, isLoading, error } = useTicketComments(ticketId);

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

  const comments = data ?? [];
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>;
  }

  const fmt = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <ul className="flex flex-col gap-2">
      {comments.map((c) => (
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
  );
}
