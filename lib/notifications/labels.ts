import type { NotificationType } from '@/lib/types/domain';

/** Short type label shown as the notification's heading (panel + toast). */
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  TicketClosed: 'Yêu cầu đã đóng',
  DailyReminder: 'Nhắc việc tồn đọng',
  TicketAssigned: 'Được giao yêu cầu',
  TicketForwarded: 'Chuyển phòng ban',
  StatusChanged: 'Cập nhật trạng thái',
  TicketCreated: 'Yêu cầu mới',
  TicketCommented: 'Bình luận mới',
  CloseRequested: 'Yêu cầu đóng',
  CloseRefused: 'Từ chối đóng',
  RedirectRequested: 'Xin chuyển phòng ban',
  RedirectRefused: 'Từ chối chuyển',
};

/** One-line message for a notification, given its type and the ticket code. */
export function notificationMessage(type: NotificationType, code: string): string {
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
    case 'CloseRequested':
      return `Có yêu cầu đóng cần duyệt trên ${code}.`;
    case 'CloseRefused':
      return `Yêu cầu đóng ${code} bị từ chối. Vui lòng kiểm tra và xử lý lại.`;
    case 'RedirectRequested':
      return `Có yêu cầu chuyển phòng ban cần duyệt trên ${code}.`;
    case 'RedirectRefused':
      return `Yêu cầu chuyển phòng ban ${code} bị từ chối.`;
    default:
      return '';
  }
}