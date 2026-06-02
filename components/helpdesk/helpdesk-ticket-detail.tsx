'use client';

import { useTicket, useTicketHistory } from '@/lib/queries/tickets';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/lib/auth/session';
import {
  canAssign,
  canCloseTicket,
  canComment,
  canForward,
  canOverrideSeverity,
  canRedirect,
  canViewQueue,
} from '@/lib/auth/rbac';
import {
  canAssignFrom,
  canCloseFrom,
  canForwardFrom,
  canOverrideSeverityFrom,
  canRedirectFrom,
} from '@/lib/status/transitions';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { InternalStatusBadge } from '@/components/ui/internal-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '@/components/ui/access-denied';
import { Timeline } from '@/components/tickets/timeline';
import { AttachmentList } from '@/components/tickets/attachment-list';
import { CommentBox } from '@/components/tickets/comment-box';
import { CommentList } from '@/components/tickets/comment-list';
import { AssignDialog } from './assign-dialog';
import { ForwardDialog } from './forward-dialog';
import { RedirectDialog } from './redirect-dialog';
import { SeverityOverrideDialog } from './severity-override-dialog';
import { CloseDialog } from './close-dialog';

/** Helpdesk console ticket detail — internal status + role×status-gated actions. */
export function HelpdeskTicketDetail({ id }: { id: string }) {
  const { user, role } = useSession();
  const { data: ticket, isLoading, error } = useTicket(id);
  const history = useTicketHistory(id);

  if (!canViewQueue(role)) return <AccessDenied />;

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
        <h1 className="text-xl font-semibold sm:text-2xl">{ticket.title}</h1>
        <p className="text-sm text-muted-foreground">
          {ticket.category?.name ?? 'Chưa phân loại'}
          {ticket.routedDepartment ? ` · ${ticket.routedDepartment.name}` : ' · Chưa giao'}
          {' · '}
          {ticket.helpdeskAssignee
            ? `Phụ trách: ${ticket.helpdeskAssignee.displayName}`
            : 'Chưa gán nhân viên'}
        </p>
      </header>

      {/* Action toolbar — each control gated by role (matrix) AND current status (§2 machine). */}
      <div className="flex flex-wrap gap-2">
        {canAssign(role) && canAssignFrom(s) ? <AssignDialog ticket={ticket} /> : null}
        {canForward(role) && canForwardFrom(s) ? <ForwardDialog ticket={ticket} /> : null}
        {canRedirect(role) && canRedirectFrom(s) ? <RedirectDialog ticket={ticket} /> : null}
        {canOverrideSeverity(role) && canOverrideSeverityFrom(s) ? (
          <SeverityOverrideDialog ticket={ticket} />
        ) : null}
        {canCloseTicket(role, user.id, ticket) && canCloseFrom(s) ? (
          <CloseDialog ticket={ticket} />
        ) : null}
      </div>

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
            {canComment(role, user.id, ticket, user.departmentId) ? (
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
