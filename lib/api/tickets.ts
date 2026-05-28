import { apiFetch } from './client';
import type {
  ListTicketsQuery,
  Paginated,
  Severity,
  Ticket,
  TicketComment,
  TicketEvent,
} from '@/lib/types/domain';

function toQuery(q: ListTicketsQuery = {}): string {
  const p = new URLSearchParams();
  if (q.status) p.set('status', q.status === 'open' ? 'open' : q.status.join(','));
  if (q.severity?.length) p.set('severity', q.severity.join(','));
  if (q.categoryId) p.set('categoryId', q.categoryId);
  if (q.assigneeId) p.set('assigneeId', q.assigneeId);
  if (q.q) p.set('q', q.q);
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  if (q.sort) p.set('sort', q.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const listTickets = (q?: ListTicketsQuery) =>
  apiFetch<Paginated<Ticket>>(`/tickets${toQuery(q)}`);

export const getTicket = (id: string) => apiFetch<Ticket>(`/tickets/${id}`);

export const getTicketHistory = (id: string) =>
  apiFetch<TicketEvent[]>(`/tickets/${id}/history`);

export const createTicket = (form: FormData) =>
  apiFetch<Ticket>('/tickets', { method: 'POST', body: form });

export const addComment = (id: string, form: FormData) =>
  apiFetch<TicketComment>(`/tickets/${id}/comments`, { method: 'POST', body: form });

export const assignAgent = (id: string, agentId: string) =>
  apiFetch<Ticket>(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify({ agentId }) });

export const forwardTicket = (id: string, departmentId: string) =>
  apiFetch<Ticket>(`/tickets/${id}/forward`, {
    method: 'POST',
    body: JSON.stringify({ departmentId }),
  });

export const redirectTicket = (id: string, departmentId: string, reason: string) =>
  apiFetch<Ticket>(`/tickets/${id}/redirect`, {
    method: 'POST',
    body: JSON.stringify({ departmentId, reason }),
  });

export const startProgress = (id: string) =>
  apiFetch<Ticket>(`/tickets/${id}/progress`, { method: 'POST' });

export const overrideSeverity = (id: string, severity: Severity) =>
  apiFetch<Ticket>(`/tickets/${id}/severity`, {
    method: 'PATCH',
    body: JSON.stringify({ severity }),
  });

export const closeTicket = (id: string, note?: string) =>
  apiFetch<Ticket>(`/tickets/${id}/close`, { method: 'POST', body: JSON.stringify({ note }) });
