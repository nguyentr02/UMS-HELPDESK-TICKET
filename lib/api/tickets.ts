import { apiFetch } from './client';
import { uploadFilesToBlob } from './uploads';
import type {
  ListTicketsQuery,
  Paginated,
  Severity,
  Ticket,
  TicketComment,
  TicketEvent,
} from '@/lib/types/domain';

/**
 * Pull form fields + the `attachments` File[] out of a FormData, upload the
 * files to Vercel Blob first, then return the JSON payload to POST.
 * The BE-side multipart route still exists as a fallback for small files /
 * older clients, but going through Blob means we're no longer constrained
 * by Vercel's 4.5 MB function-body limit.
 */
async function formDataToJsonBody(form: FormData): Promise<Record<string, unknown>> {
  // The FE forms append files under the key `files` (see ticket-form.tsx).
  // Accept `attachments` too in case any other form ever switches.
  const fileVals = [...form.getAll('files'), ...form.getAll('attachments')];
  const files = fileVals.filter((v): v is File => v instanceof File);
  const attachments = await uploadFilesToBlob(files);
  const body: Record<string, unknown> = { attachments };
  for (const [k, v] of form.entries()) {
    if (k === 'files' || k === 'attachments') continue;
    // FormData values are string|File; only stash string fields here.
    if (typeof v === 'string') body[k] = v;
  }
  return body;
}

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

export const listTicketComments = (id: string) =>
  apiFetch<TicketComment[]>(`/tickets/${id}/comments`);

export async function createTicket(form: FormData): Promise<Ticket> {
  const body = await formDataToJsonBody(form);
  return apiFetch<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(body) });
}

export async function addComment(id: string, form: FormData): Promise<TicketComment> {
  const body = await formDataToJsonBody(form);
  return apiFetch<TicketComment>(`/tickets/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export const assignAgent = (id: string, agentId: string) =>
  apiFetch<Ticket>(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify({ agentId }) });

export const forwardTicket = (id: string, departmentId: string) =>
  apiFetch<Ticket>(`/tickets/${id}/forward`, {
    method: 'POST',
    body: JSON.stringify({ departmentId }),
  });

export const startProgress = (id: string) =>
  apiFetch<Ticket>(`/tickets/${id}/progress`, { method: 'POST' });

export const overrideSeverity = (id: string, severity: Severity) =>
  apiFetch<Ticket>(`/tickets/${id}/severity`, {
    method: 'PATCH',
    body: JSON.stringify({ severity }),
  });

export const assignCategory = (id: string, categoryId: string | null) =>
  apiFetch<Ticket>(`/tickets/${id}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryId }),
  });

export const closeTicket = (id: string, note?: string) =>
  apiFetch<Ticket>(`/tickets/${id}/close`, { method: 'POST', body: JSON.stringify({ note }) });
