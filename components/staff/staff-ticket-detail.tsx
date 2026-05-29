'use client';

import { useTicket, useTicketHistory } from '@/lib/queries/tickets';
import { ApiError } from '@/lib/api/client';
import { useRole } from '@/lib/auth/session';
import { canUpdateProgress, canViewDeptQueue } from '@/lib/auth/rbac';
import { canProgressFrom } from '@/lib/status/transitions';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { InternalStatusBadge } from '@/components/ui/internal-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '@/components/ui/access-denied';
import { Timeline } from '@/components/tickets/timeline';
import { AttachmentList } from '@/components/tickets/attachment-list';
import { CommentBox } from '@/components/tickets/comment-box';
import { ProgressButton } from './progress-button';

/**
 * Dept Staff ticket detail (S6) — internal status + the single "Bắt đầu xử lý"
 * action (no assign/forward/redirect/close — those are Helpdesk-only per the matrix)
 * plus commenting.
 */
export function StaffTicketDetail({ id }: { id: string }) {
  const role = useRole();
  const { data: ticket, isLoading, error } = useTicket(id);
  const history = useTicketHistory(id);

  if (!canViewDeptQueue(role)) return <AccessDenied />;

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

  const s = ticket.internalStatus;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{ticket.code}</span>
          <SeverityBadge severity={ticket.severity} />
          <InternalStatusBadge status={s} />
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{ticket.title}</h1>
        <p className="text-sm text-muted-foreground">
          {ticket.category?.name ?? 'Chưa phân loại'}
          {ticket.routedDepartment ? ` · ${ticket.routedDepartment.name}` : ''}
          {` · Người yêu cầu: ${ticket.requester.displayName}`}
        </p>
      </header>

      {/* Only Mark-In-Progress, gated by role (matrix) AND status (Assigned → InProgress). */}
      {canUpdateProgress(role) && canProgressFrom(s) ? (
        <div className="flex flex-wrap gap-2">
          <ProgressButton ticket={ticket} />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-medium">Mô tả</h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{ticket.description}</p>
          </section>

          {ticket.attachments.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-base font-medium">Tệp đính kèm</h2>
              <AttachmentList attachments={ticket.attachments} />
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-medium">Bình luận</h2>
            <CommentBox ticketId={ticket.id} />
          </section>
        </div>

        <aside>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-medium">Lịch sử xử lý</h2>
            {history.isLoading ? (
              <Skeleton className="h-16" />
            ) : (
              <Timeline events={history.data ?? []} />
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
