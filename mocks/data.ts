import type {
  Category,
  Department,
  EventType,
  NotificationItem,
  Severity,
  Ticket,
  TicketComment,
  TicketEvent,
  TicketStatus,
  UserRef,
} from '@/lib/types/domain';
import { backlogAgeDays, toExternalStatus } from '@/lib/status/status';

let idSeq = 1000;
export const nextId = (prefix = 'id'): string => `${prefix}-${++idSeq}`;
let codeSeq = 100;
export const nextCode = (): string => `HD-2026-${String(++codeSeq).padStart(6, '0')}`;

export const departments: Department[] = [
  { id: 'dep-it', code: 'IT', name: 'CAIRA / Phòng IT' },
  { id: 'dep-csvc', code: 'CSVC', name: 'Phòng Quản trị CSVC' },
  { id: 'dep-dt', code: 'DT', name: 'Phòng Đào tạo / CTSV' },
  { id: 'dep-kt', code: 'KT', name: 'Phòng Kế toán' },
  { id: 'dep-hcns', code: 'HCNS', name: 'Phòng HCNS' },
];

export const categories: Category[] = [
  { id: 'cat-it', name: 'IT / Hệ thống số', isActive: true },
  { id: 'cat-csvc', name: 'Cơ sở vật chất (CSVC)', isActive: true },
  { id: 'cat-hocvu', name: 'Học vụ / Đào tạo', isActive: true },
  { id: 'cat-taichinh', name: 'Tài chính', isActive: true },
  { id: 'cat-hcns', name: 'Nhân sự (HCNS)', isActive: true },
  { id: 'cat-khac', name: 'Khác', isActive: true },
];

// Known identities (match lib/auth/session mock users). Agents are the assignable set.
export const USERS: Record<string, UserRef> = {
  'u-sv': { id: 'u-sv', displayName: 'SV Nguyễn Văn A' },
  'u-gv': { id: 'u-gv', displayName: 'GV Trần Văn B' },
  'u-nv': { id: 'u-nv', displayName: 'NV Lê Văn C' },
  'u-staff': { id: 'u-staff', displayName: 'CB Phòng CSVC' },
  'u-hdl': { id: 'u-hdl', displayName: 'Vũ Văn Hùng' },
  'u-hda': { id: 'u-hda', displayName: 'Đỗ Thị Mai' },
  'u-hda2': { id: 'u-hda2', displayName: 'Bùi Thị Lan' },
  'u-hda3': { id: 'u-hda3', displayName: 'Hoàng Văn Nam' },
  'u-admin': { id: 'u-admin', displayName: 'Quản trị viên' },
};

export const agents: UserRef[] = [USERS['u-hda'], USERS['u-hda2'], USERS['u-hda3']];
export const HELPDESK_ACTOR: UserRef = USERS['u-hdl'];

const findDept = (id: string | null | undefined) =>
  id ? (departments.find((d) => d.id === id) ?? null) : null;
const findCat = (id: string | null | undefined) =>
  id ? (categories.find((c) => c.id === id) ?? null) : null;

interface MakeTicketInput {
  title: string;
  description: string;
  severity: Severity;
  categoryId?: string | null;
  status?: TicketStatus;
  requesterId?: string;
  assigneeId?: string | null;
  departmentId?: string | null;
  createdAt?: string;
}

export function makeTicket(input: MakeTicketInput): Ticket {
  const status = input.status ?? 'Pending';
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    id: nextId('tk'),
    code: nextCode(),
    title: input.title,
    description: input.description,
    severity: input.severity,
    internalStatus: status,
    externalStatus: toExternalStatus(status),
    category: findCat(input.categoryId),
    requester: USERS[input.requesterId ?? 'u-sv'] ?? USERS['u-sv'],
    helpdeskAssignee: input.assigneeId ? (USERS[input.assigneeId] ?? null) : null,
    routedDepartment: findDept(input.departmentId),
    attachments: [],
    createdAt,
    updatedAt: createdAt,
    closedAt: status === 'Closed' ? createdAt : null,
    backlogAgeDays: backlogAgeDays(createdAt),
  };
}

// Mutable in-memory store (the practice mock backend).
export const tickets: Ticket[] = [
  makeTicket({
    title: 'Không đăng nhập được UMS',
    description: 'Báo lỗi sai mật khẩu dù nhập đúng.',
    severity: 'Critical',
    categoryId: 'cat-it',
    status: 'Pending',
    requesterId: 'u-sv',
    createdAt: '2026-05-27T01:00:00Z',
  }),
  makeTicket({
    title: 'Mất điện phòng A1.05',
    description: 'Phòng học A1.05 mất điện từ đầu giờ sáng.',
    severity: 'High',
    categoryId: 'cat-csvc',
    status: 'InProgress',
    requesterId: 'u-sv',
    assigneeId: 'u-hda',
    departmentId: 'dep-csvc',
    createdAt: '2026-05-25T02:00:00Z',
  }),
  makeTicket({
    title: 'Xin xác nhận sinh viên',
    description: 'Cần giấy xác nhận đang học.',
    severity: 'Low',
    categoryId: 'cat-hocvu',
    status: 'Closed',
    requesterId: 'u-sv',
    assigneeId: 'u-hda',
    departmentId: 'dep-dt',
    createdAt: '2026-05-20T01:00:00Z',
  }),
  makeTicket({
    title: 'Sai thông tin học phí',
    description: 'Học phí hiển thị không đúng.',
    severity: 'Medium',
    categoryId: 'cat-taichinh',
    status: 'Assigned',
    requesterId: 'u-nv',
    assigneeId: 'u-hda2',
    departmentId: 'dep-kt',
    createdAt: '2026-05-26T03:00:00Z',
  }),
  makeTicket({
    title: 'Wifi chậm khu B',
    description: 'Kết nối Wifi khu B rất chậm vào buổi chiều.',
    severity: 'High',
    categoryId: 'cat-it',
    status: 'Pending',
    requesterId: 'u-gv',
    createdAt: '2026-05-27T06:00:00Z',
  }),
  // Assigned to the CSVC department — the Dept Staff (u-staff / dep-csvc) can pick
  // this up and mark it In Progress (story S6).
  makeTicket({
    title: 'Máy chiếu phòng B2.10 không lên hình',
    description: 'Máy chiếu phòng B2.10 bật nguồn nhưng không hiển thị, cần kiểm tra.',
    severity: 'Medium',
    categoryId: 'cat-csvc',
    status: 'Assigned',
    requesterId: 'u-gv',
    assigneeId: 'u-hda',
    departmentId: 'dep-csvc',
    createdAt: '2026-05-28T03:00:00Z',
  }),
];

// Seed an audit trail per ticket (Created always; richer for progressed tickets).
export const events: Record<string, TicketEvent[]> = {};
function seedEvent(ticketId: string, ev: Partial<TicketEvent> & { type: EventType; actor: UserRef; createdAt: string }) {
  (events[ticketId] ??= []).push({
    id: nextId('ev'),
    ticketId,
    actor: ev.actor,
    type: ev.type,
    fromStatus: ev.fromStatus ?? null,
    toStatus: ev.toStatus ?? null,
    fromDepartmentId: ev.fromDepartmentId ?? null,
    toDepartmentId: ev.toDepartmentId ?? null,
    note: ev.note ?? null,
    createdAt: ev.createdAt,
  });
}
for (const t of tickets) {
  seedEvent(t.id, { type: 'Created', actor: t.requester, toStatus: 'Pending', createdAt: t.createdAt });
  if (t.helpdeskAssignee) {
    seedEvent(t.id, {
      type: 'AgentAssigned',
      actor: HELPDESK_ACTOR,
      note: `Gán cho ${t.helpdeskAssignee.displayName}`,
      createdAt: t.createdAt,
    });
  }
  if (t.routedDepartment) {
    seedEvent(t.id, {
      type: 'Forwarded',
      actor: HELPDESK_ACTOR,
      fromStatus: 'Pending',
      toStatus: 'Assigned',
      toDepartmentId: t.routedDepartment.id,
      createdAt: t.createdAt,
    });
  }
  if (t.internalStatus === 'InProgress') {
    seedEvent(t.id, { type: 'Started', actor: HELPDESK_ACTOR, fromStatus: 'Assigned', toStatus: 'InProgress', createdAt: t.createdAt });
  }
  if (t.internalStatus === 'Closed') {
    seedEvent(t.id, { type: 'Closed', actor: HELPDESK_ACTOR, toStatus: 'Closed', note: 'Đã xử lý xong.', createdAt: t.closedAt ?? t.createdAt });
  }
}

export const comments: Record<string, TicketComment[]> = {};

export interface MockNotification extends NotificationItem {
  userId: string;
}

export const notifications: MockNotification[] = [
  {
    id: nextId('nt'),
    userId: 'u-sv',
    type: 'TicketClosed',
    ticketId: tickets[2].id,
    payload: { code: tickets[2].code },
    readAt: null,
    createdAt: '2026-05-20T02:00:00Z',
  },
  {
    id: nextId('nt'),
    userId: 'u-hda',
    type: 'TicketAssigned',
    ticketId: tickets[1].id,
    payload: { code: tickets[1].code },
    readAt: '2026-05-25T02:30:00Z',
    createdAt: '2026-05-25T02:05:00Z',
  },
  {
    id: nextId('nt'),
    userId: 'u-hda',
    type: 'DailyReminder',
    ticketId: null,
    payload: {
      tickets: [
        { ticketId: tickets[1].id, code: tickets[1].code, severity: 'High', backlogAgeDays: 3 },
      ],
    },
    readAt: null,
    createdAt: '2026-05-28T02:00:00Z',
  },
];

/** Append an audit event to a ticket's history (used by the mutation handlers). */
export function appendEvent(
  ticketId: string,
  ev: Pick<TicketEvent, 'type' | 'actor'> &
    Partial<Omit<TicketEvent, 'type' | 'actor' | 'id' | 'ticketId'>>,
): TicketEvent {
  const full: TicketEvent = {
    id: nextId('ev'),
    ticketId,
    actor: ev.actor,
    type: ev.type,
    fromStatus: ev.fromStatus ?? null,
    toStatus: ev.toStatus ?? null,
    fromDepartmentId: ev.fromDepartmentId ?? null,
    toDepartmentId: ev.toDepartmentId ?? null,
    note: ev.note ?? null,
    createdAt: ev.createdAt ?? new Date().toISOString(),
  };
  (events[ticketId] ??= []).push(full);
  return full;
}

/** Apply a status transition (keeps external status + timestamps in sync). */
export function setStatus(t: Ticket, status: TicketStatus): void {
  t.internalStatus = status;
  t.externalStatus = toExternalStatus(status);
  t.updatedAt = new Date().toISOString();
  if (status === 'Closed') t.closedAt = t.updatedAt;
}
