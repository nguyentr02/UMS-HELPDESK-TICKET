'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import type { NotificationItem as Notification, NotificationType, Severity } from '@/lib/types/domain';
import { useRole } from '@/lib/auth/session';
import { ticketDetailHref } from '@/lib/auth/nav';
import { useMarkNotificationRead } from '@/lib/queries/notifications';
import { SEVERITY_META } from '@/lib/status/severity';

const TYPE_LABEL: Record<NotificationType, string> = {
  TicketClosed: 'Yêu cầu đã đóng',
  DailyReminder: 'Nhắc việc tồn đọng',
  TicketAssigned: 'Được giao yêu cầu',
  TicketForwarded: 'Chuyển phòng ban',
  StatusChanged: 'Cập nhật trạng thái',
  TicketCreated: 'Yêu cầu mới',
  TicketCommented: 'Bình luận mới',
};

interface BacklogEntry {
  ticketId: string;
  code: string;
  severity: Severity;
  backlogAgeDays: number;
}

function messageFor(type: NotificationType, code: string): string {
  switch (type) {
    case 'TicketClosed':
      return `Yêu cầu ${code} đã được xử lý xong.`;
    case 'TicketAssigned':
      return `Bạn được giao yêu cầu ${code}.`;
    case 'TicketForwarded':
      return `Yêu cầu ${code} đã được chuyển phòng ban.`;
    case 'StatusChanged':
      return `Yêu cầu ${code} đã cập nhật trạng thái.`;
    case 'TicketCreated':
      return `Có yêu cầu mới: ${code}.`;
    case 'TicketCommented':
      return `Có bình luận mới trên ${code}.`;
    default:
      return '';
  }
}

/** One notification row — type-specific copy, an unread marker, and mark-as-read (with retry). */
export function NotificationItem({ item, onNavigate }: { item: Notification; onNavigate?: () => void }) {
  const role = useRole();
  const markRead = useMarkNotificationRead();
  const unread = !item.readAt;
  // BE sends `ticketCode` in the payload; tolerate the legacy `code` key too
  // so old MSW fixtures and stale rows keep rendering.
  const code =
    (typeof item.payload.ticketCode === 'string' && item.payload.ticketCode) ||
    (typeof item.payload.code === 'string' && item.payload.code) ||
    '';
  const backlog: BacklogEntry[] = Array.isArray(item.payload.tickets)
    ? (item.payload.tickets as BacklogEntry[])
    : [];

  async function onMarkRead() {
    try {
      await markRead.mutateAsync(item.id);
    } catch {
      toast.error('Không đánh dấu được. Vui lòng thử lại.');
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2">
          {unread ? (
            <span
              role="img"
              aria-label="Chưa đọc"
              className="h-2 w-2 shrink-0 rounded-full bg-red-600"
            />
          ) : null}
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {TYPE_LABEL[item.type]}
          </span>
        </span>
        <time className="shrink-0 text-xs text-muted-foreground" dateTime={item.createdAt}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </time>
      </div>

      {item.type === 'DailyReminder' ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm">Bạn có {backlog.length} yêu cầu tồn đọng cần xử lý.</p>
          <ul className="flex flex-col gap-1">
            {backlog.map((b) => (
              <li key={b.ticketId}>
                <Link
                  href={ticketDetailHref(role, b.ticketId)}
                  onClick={onNavigate}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <span aria-hidden>{SEVERITY_META[b.severity].emoji}</span>
                  <span className="font-mono text-xs">{b.code}</span>
                  <span className="text-muted-foreground">· {b.backlogAgeDays} ngày</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : item.ticketId ? (
        <Link
          href={ticketDetailHref(role, item.ticketId)}
          onClick={() => {
            if (unread) void onMarkRead();
            onNavigate?.();
          }}
          className="text-sm hover:underline"
        >
          {messageFor(item.type, code)}
        </Link>
      ) : (
        <p className="text-sm">{messageFor(item.type, code)}</p>
      )}
    </div>
  );
}
