'use client';

import { useTicket, useTicketHistory } from '@/lib/queries/tickets';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/lib/auth/session';
import { canComment } from '@/lib/auth/rbac';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Timeline } from './timeline';
import { AttachmentList } from './attachment-list';
import { CommentBox } from './comment-box';
import { CommentList } from './comment-list';

/** Requester ticket detail — external status + timeline (read-only, no reopen). */
export function TicketDetail({ id }: { id: string }) {
  const session = useSession();
  const role = session.role;
  const { data: ticket, isLoading, error } = useTicket(id);
  const history = useTicketHistory(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 403
        ? 'Bạn không có quyền xem yêu cầu này.'
        : status === 404
          ? 'Không tìm thấy yêu cầu.'
          : 'Đã xảy ra lỗi khi tải yêu cầu.';
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {message}
      </p>
    );
  }

  if (!ticket) return null;

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{ticket.code}</span>
          <SeverityBadge severity={ticket.severity} />
          <StatusBadge status={ticket.externalStatus} />
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{ticket.title}</h1>
        <p className="text-base text-muted-foreground">
          {ticket.category?.name ?? 'Chưa phân loại'}
          {ticket.routedDepartment ? ` · ${ticket.routedDepartment.name}` : ''}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Mô tả</h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed">{ticket.description}</p>
      </section>

      {ticket.attachments.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Tệp đính kèm</h2>
          <AttachmentList attachments={ticket.attachments} />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Lịch sử xử lý</h2>
        {history.isLoading ? <Skeleton className="h-16" /> : <Timeline events={history.data ?? []} />}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Bình luận</h2>
        <CommentList ticketId={ticket.id} />
        {canComment(role, session.user.id, ticket) ? (
          <CommentBox ticketId={ticket.id} />
        ) : null}
      </section>
    </article>
  );
}
