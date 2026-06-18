'use client';

import { AttachmentList } from '@/components/tickets/attachment-list';
import { CommentBox } from '@/components/tickets/comment-box';
import { CommentList } from '@/components/tickets/comment-list';
import { TicketErrorState } from '@/components/tickets/ticket-error-state';
import { Timeline } from '@/components/tickets/timeline';
import { AccessDenied } from '@/components/ui/access-denied';
import { InternalStatusBadge } from '@/components/ui/internal-status-badge';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  canComment,
  canRequestCloseTicket,
  canRequestRedirectTicket,
  canUpdateProgress,
  canViewDeptQueue,
} from '@/lib/auth/rbac';
import { useSession } from '@/lib/auth/session';
import { useTicket, useTicketHistory } from '@/lib/queries/tickets';
import { canProgressFrom, canRequestRedirectFrom } from '@/lib/status/transitions';

import { ProgressButton } from './progress-button';
import { RequestCloseDialog } from './request-close-dialog';
import { RequestRedirectDialog } from './request-redirect-dialog';

/**
 * Dept Staff ticket detail (S6) — internal status + the single "Bắt đầu xử lý"
 * action (no assign/forward/close — those are Helpdesk-only per the matrix)
 * plus commenting.
 */
export function StaffTicketDetail({ id }: { id: string }) {
  const session = useSession();
  const role = session.role;
  const { data: ticket, isLoading, error, refetch } = useTicket(id);
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
    return (
      <TicketErrorState
        error={error}
        backHref="/staff/queue"
        backLabel="Quay lại hàng đợi"
        onRetry={() => void refetch()}
      />
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
        <h1 className="text-xl font-semibold sm:text-2xl">{ticket.title}</h1>
        <p className="text-sm text-muted-foreground">
          {ticket.category?.name ?? 'Chưa phân loại'}
          {ticket.routedDepartment ? ` · ${ticket.routedDepartment.name}` : ''}
          {` · Người yêu cầu: ${ticket.requester.displayName}`}
        </p>
      </header>

      {/* DeptStaff actions: Mark-In-Progress (Assigned→InProgress); once in
          progress, request a close with proof; and (Assigned/InProgress) ask
          Helpdesk to redirect the ticket to another department. */}
      {(() => {
        const showProgress = canUpdateProgress(role) && canProgressFrom(s);
        const showRequestClose =
          canRequestCloseTicket(role, session.user.departmentId, ticket) && s === 'InProgress';
        const showRequestRedirect =
          canRequestRedirectTicket(role, session.user.departmentId, ticket) &&
          canRequestRedirectFrom(s);
        return showProgress || showRequestClose || showRequestRedirect ? (
          <div className="flex flex-wrap gap-2">
            {showProgress ? <ProgressButton ticket={ticket} /> : null}
            {showRequestClose ? <RequestCloseDialog ticket={ticket} /> : null}
            {showRequestRedirect ? <RequestRedirectDialog ticket={ticket} /> : null}
          </div>
        ) : null;
      })()}

      {/* Pending-review banners for the staffer who asked. */}
      {canRequestCloseTicket(role, session.user.departmentId, ticket) && s === 'CloseRequested' ? (
        <p
          role="status"
          className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-900"
        >
          Đã gửi yêu cầu đóng — đang chờ Helpdesk duyệt.
        </p>
      ) : null}
      {canRequestRedirectTicket(role, session.user.departmentId, ticket) && s === 'RedirectRequested' ? (
        <p
          role="status"
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900"
        >
          Đã gửi yêu cầu chuyển phòng ban — đang chờ Helpdesk duyệt.
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bình luận</h2>
            <CommentList ticketId={ticket.id} />
            {canComment(role, session.user.id, ticket, session.user.departmentId) ? (
              <CommentBox ticketId={ticket.id} />
            ) : null}
          </section>
        </div>

        <aside>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lịch sử xử lý</h2>
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
