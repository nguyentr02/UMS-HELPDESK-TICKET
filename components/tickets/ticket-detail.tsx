'use client';

import { SeverityBadge } from '@/components/ui/severity-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { canComment } from '@/lib/auth/rbac';
import { useSession } from '@/lib/auth/session';
import { useTicket, useTicketHistory } from '@/lib/queries/tickets';

import { AttachmentList } from './attachment-list';
import { CommentBox } from './comment-box';
import { CommentList } from './comment-list';
import { TicketErrorState } from './ticket-error-state';
import { Timeline } from './timeline';

/** Requester ticket detail — external status + timeline (read-only, no reopen). */
export function TicketDetail({ id }: { id: string }) {
  const session = useSession();
  const role = session.role;
  const { data: ticket, isLoading, error, refetch } = useTicket(id);
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
    return (
      <TicketErrorState
        error={error}
        backHref="/tickets"
        backLabel="Quay lại danh sách yêu cầu"
        onRetry={() => void refetch()}
      />
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
        <h1 className="text-xl font-semibold sm:text-2xl">{ticket.title}</h1>
        <p className="text-base text-muted-foreground">
          {ticket.category?.name ?? 'Chưa phân loại'}
          {ticket.routedDepartment ? ` · ${ticket.routedDepartment.name}` : ''}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mô tả</h2>
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {ticket.description}
          </p>
        </div>
      </section>

      {ticket.attachments.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tệp đính kèm</h2>
          <AttachmentList attachments={ticket.attachments} />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lịch sử xử lý</h2>
        {history.isLoading ? <Skeleton className="h-16" /> : <Timeline events={history.data ?? []} />}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bình luận</h2>
        <CommentList ticketId={ticket.id} />
        {canComment(role, session.user.id, ticket) ? (
          <CommentBox ticketId={ticket.id} />
        ) : null}
      </section>
    </article>
  );
}
