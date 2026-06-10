// Domain types for M31 Helpdesk/Ticket FE — mirror feature-plan Appendix A.
// Role identifiers match role-permission-matrix.md verbatim.

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Pending' | 'Assigned' | 'InProgress' | 'Closed';
export type ExternalStatus = 'Requested' | 'Processing' | 'Finished';
export type Role = 'SV' | 'GV' | 'NV' | 'HelpdeskAgent' | 'HelpdeskLead' | 'DeptStaff' | 'Admin';
export type NotificationType =
  | 'TicketClosed'
  | 'DailyReminder'
  | 'TicketAssigned'
  | 'TicketForwarded'
  | 'StatusChanged'
  | 'TicketCreated'
  | 'TicketCommented';
export type EventType =
  | 'Created'
  | 'AgentAssigned'
  | 'Forwarded'
  | 'Started'
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

/**
 * Admin user directory DTO (BE: `GET /users` and `GET /users/:id`). Sensitive
 * fields (`passwordHash`, `ssoSubject`, `googleId`, `avatarUrl`) are projected
 * out by the BE and never appear here.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  department: Department | null;
}

export interface UserListResponse {
  items: User[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListUsersQuery {
  role?: Role;
  departmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Admin-only create input. `departmentId` is required when `role=DeptStaff`;
 *  `password` is optional — blank means SSO-only login. */
export interface CreateUserInput {
  email: string;
  displayName: string;
  role: Role;
  departmentId?: string | null;
  password?: string | null;
}

/** Admin-only partial update. Every field optional. `departmentId: null`
 *  clears the dept; omitting it keeps the current value. `password` (≥ 8 chars)
 *  replaces the hash; omit/null leaves it alone. Email is NOT mutable. */
export interface UpdateUserInput {
  displayName?: string;
  role?: Role;
  departmentId?: string | null;
  password?: string | null;
}

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
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
  /**
   * Direct Blob URL when available (new direct-upload flow). `null` for
   * legacy attachments stored in the memory/local adapter — those have to
   * be fetched through the auth'd BE proxy at /attachments/:id.
   */
  url: string | null;
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
  avgHandlingDays: number | null;
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
