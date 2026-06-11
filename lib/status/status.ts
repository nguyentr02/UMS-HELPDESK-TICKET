import type { EventType, ExternalStatus, TicketStatus } from '@/lib/types/domain';

// Internal (5) → external (3) status mapping — feature-plan App. B.
export const INTERNAL_TO_EXTERNAL: Record<TicketStatus, ExternalStatus> = {
  Pending: 'Requested',
  Assigned: 'Requested',
  InProgress: 'Processing',
  // A pending close request is internal-only; requesters keep seeing "Processing".
  CloseRequested: 'Processing',
  Closed: 'Finished',
};

export function toExternalStatus(status: TicketStatus): ExternalStatus {
  return INTERNAL_TO_EXTERNAL[status];
}

// Vietnamese labels shown to requesters (external).
export const EXTERNAL_STATUS_VI: Record<ExternalStatus, string> = {
  Requested: 'Đã tiếp nhận',
  Processing: 'Đang xử lý',
  Finished: 'Hoàn tất',
};

// Vietnamese labels for the 5 internal statuses — Helpdesk/Staff/Admin views only.
export const INTERNAL_STATUS_VI: Record<TicketStatus, string> = {
  Pending: 'Chờ tiếp nhận',
  Assigned: 'Đã giao phòng ban',
  InProgress: 'Đang xử lý',
  CloseRequested: 'Chờ duyệt đóng',
  Closed: 'Đã đóng',
};

// Vietnamese labels for audit events (Timeline).
export const EVENT_VI: Record<EventType, string> = {
  Created: 'Tạo yêu cầu',
  AgentAssigned: 'Gán nhân viên Helpdesk',
  Forwarded: 'Chuyển đến phòng ban',
  Started: 'Bắt đầu xử lý',
  SeverityChanged: 'Điều chỉnh mức độ',
  Commented: 'Bình luận',
  CloseRequested: 'Yêu cầu đóng',
  CloseRefused: 'Từ chối đóng',
  Closed: 'Đóng yêu cầu',
};

export const ALL_STATUSES: TicketStatus[] = [
  'Pending',
  'Assigned',
  'InProgress',
  'CloseRequested',
  'Closed',
];

// "open" / unsolved = every non-Closed state (drives the status=open filter).
export const OPEN_STATUSES: TicketStatus[] = ['Pending', 'Assigned', 'InProgress', 'CloseRequested'];

export function isOpen(status: TicketStatus): boolean {
  return status !== 'Closed';
}

// Backlog age = whole days since creation (resolved decision; feature-plan §0.5).
export function backlogAgeDays(createdAtIso: string, now: Date = new Date()): number {
  const created = new Date(createdAtIso).getTime();
  const diffMs = now.getTime() - created;
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}
