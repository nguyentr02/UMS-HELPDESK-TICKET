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
  canAssign,
  canCategorize,
  canCloseTicket,
  canComment,
  canForward,
  canOverrideSeverity,
  canRedirectTicket,
  canReviewCloseRequest,
  canReviewRedirectRequest,
  canViewQueue,
} from '@/lib/auth/rbac';
import { useSession } from '@/lib/auth/session';
import { useTicket, useTicketHistory } from '@/lib/queries/tickets';
import {
  canAssignFrom,
  canCategorizeFrom,
  canCloseFrom,
  canForwardFrom,
  canOverrideSeverityFrom,
  canRedirectFrom,
  canReviewCloseFrom,
  canReviewRedirectFrom,
} from '@/lib/status/transitions';

import { AssignDialog } from './assign-dialog';
import { CategoryAssignDialog } from './category-assign-dialog';
import { CloseDialog } from './close-dialog';
import { ForwardDialog } from './forward-dialog';
import { RedirectDialog } from './redirect-dialog';
import { ReviewCloseDialog } from './review-close-dialog';
import { ReviewRedirectDialog } from './review-redirect-dialog';
import { SeverityOverrideDialog } from './severity-override-dialog';

/** Helpdesk console ticket detail — internal status + role×status-gated actions. */
export function HelpdeskTicketDetail({ id }: { id: string }) {
  const { user, role } = useSession();
  const { data: ticket, isLoading, error, refetch } = useTicket(id);
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
    return (
      <TicketErrorState
        error={error}
        backHref="/helpdesk/queue"
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
        {/* Each triage slot is coloured amber when empty (Lead/Agent still
            needs to act on it), neutral muted when filled. The dot separators
            stay muted so the warning colour only sits on the field itself. */}
        <p className="text-sm">
          <span
            className={
              ticket.category ? 'text-muted-foreground' : 'font-medium text-amber-600'
            }
          >
            {ticket.category?.name ?? 'Chưa phân loại'}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span
            className={
              ticket.routedDepartment ? 'text-muted-foreground' : 'font-medium text-amber-600'
            }
          >
            {ticket.routedDepartment ? ticket.routedDepartment.name : 'Chưa giao'}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span
            className={
              ticket.helpdeskAssignee
                ? 'text-muted-foreground'
                : 'font-medium text-amber-600'
            }
          >
            {ticket.helpdeskAssignee
              ? `Phụ trách: ${ticket.helpdeskAssignee.displayName}`
              : 'Chưa gán nhân viên'}
          </span>
        </p>
      </header>

      {/* Action toolbar — each control gated by role (matrix) AND current status (§2 machine). */}
      <div className="flex flex-wrap gap-2">
        {canAssign(role) && canAssignFrom(s) ? <AssignDialog ticket={ticket} /> : null}
        {canForward(role) && canForwardFrom(s) ? <ForwardDialog ticket={ticket} /> : null}
        {canRedirectTicket(role, user.id, ticket) && canRedirectFrom(s) ? (
          <RedirectDialog ticket={ticket} />
        ) : null}
        {canCategorize(role) && canCategorizeFrom(s) ? (
          <CategoryAssignDialog ticket={ticket} />
        ) : null}
        {canOverrideSeverity(role) && canOverrideSeverityFrom(s) ? (
          <SeverityOverrideDialog ticket={ticket} />
        ) : null}
        {canCloseTicket(role, user.id, ticket) && canCloseFrom(s) ? (
          <CloseDialog ticket={ticket} />
        ) : null}
        {canReviewCloseRequest(role, user.id, ticket) && canReviewCloseFrom(s) ? (
          <ReviewCloseDialog ticket={ticket} />
        ) : null}
        {canReviewRedirectRequest(role, user.id, ticket) && canReviewRedirectFrom(s) ? (
          <ReviewRedirectDialog ticket={ticket} />
        ) : null}
      </div>

      {/* When a close request is pending, point the reviewer at the proof below. */}
      {canReviewCloseRequest(role, user.id, ticket) && canReviewCloseFrom(s) ? (
        <p
          role="status"
          className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-900"
        >
          Phòng ban đã yêu cầu đóng — xem minh chứng trong phần bình luận bên dưới rồi duyệt hoặc từ chối.
        </p>
      ) : null}
      {/* When a redirect request is pending, point the reviewer at the reason. */}
      {canReviewRedirectRequest(role, user.id, ticket) && canReviewRedirectFrom(s) ? (
        <p
          role="status"
          className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900"
        >
          Phòng ban xin chuyển ticket — xem lý do trong lịch sử rồi chọn phòng ban mới (Duyệt) hoặc Từ chối.
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
