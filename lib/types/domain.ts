// Domain types for M31 Helpdesk/Ticket FE — mirror feature-plan Appendix A.
// Role identifiers match role-permission-matrix.md verbatim.

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Pending' | 'Assigned' | 'InProgress' | 'Redirected' | 'Closed';
export type ExternalStatus = 'Requested' | 'Processing' | 'Finished';
export type Role = 'SV' | 'GV' | 'NV' | 'HelpdeskAgent' | 'HelpdeskLead' | 'DeptStaff' | 'Admin';
export type NotificationType =
  | 'TicketClosed'
  | 'DailyReminder'
  | 'TicketAssigned'
  | 'TicketForwarded'
  | 'StatusChanged';
export type EventType =
  | 'Created'
  | 'AgentAssigned'
  | 'Forwarded'
  | 'Started'
  | 'Redirected'
  | 'SeverityChanged'
  | 'Commented'
  | 'Closed';
export type AttachmentKind = 'Image' | 'Document';

export interface UserRef {
  id: string;
  displayName: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
}

export interface RoutingRule {
  id: string;
  categoryId: string;
  departmentId: string;
  isDefault: boolean;
}

export interface Attachment {
  id: string;
  ticketId: string;
  commentId: string | null;
  uploader: UserRef;
  filename: string;
  mimeType: string;
  kind: AttachmentKind;
  sizeBytes: number;
  createdAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: UserRef;
  body: string;
  createdAt: string;
  attachments: Attachment[];
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  actor: UserRef;
  type: EventType;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  fromDepartmentId: string | null;
  toDepartmentId: string | null;
  note: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: Severity;
  internalStatus: TicketStatus;
  externalStatus: ExternalStatus;
  category: Category | null;
  requester: UserRef;
  helpdeskAssignee: UserRef | null;
  routedDepartment: Department | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  backlogAgeDays: number;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  ticketId: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface ListTicketsQuery {
  status?: 'open' | TicketStatus[];
  severity?: Severity[];
  categoryId?: string;
  assigneeId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  page: PageMeta;
}

export interface AnalyticsSummary {
  total: number;
  open: number;
  closed: number;
  avgHandlingDays: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<TicketStatus, number>;
  byDepartment: { departmentId: string; name: string; count: number }[];
  byCategory: { categoryId: string; name: string; count: number }[];
}

// Standard response envelope (feature-plan App. A).
export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiErrorBody | null;
  requestId: string;
}
