import { http, HttpResponse } from 'msw';
import type { AnalyticsSummary, Severity, TicketComment } from '@/lib/types/domain';
import { SEVERITY_META } from '@/lib/status/severity';
import {
  HELPDESK_ACTOR,
  USERS,
  agents,
  appendEvent,
  categories,
  comments,
  departments,
  events,
  makeTicket,
  nextId,
  notifications,
  setStatus,
  tickets,
} from './data';

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';
const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

function ok<T>(data: T, init?: ResponseInit) {
  return HttpResponse.json({ data, error: null, requestId: nextId('req') }, init);
}
function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return HttpResponse.json(
    { data: null, error: { code, message, ...(fields ? { fields } : {}) }, requestId: nextId('req') },
    { status },
  );
}

interface Caller {
  id: string;
  role: string;
  deptId: string;
}
function caller(request: Request): Caller {
  return {
    id: request.headers.get('X-Mock-User-Id') ?? '',
    role: request.headers.get('X-Mock-Role') ?? '',
    deptId: request.headers.get('X-Mock-Dept-Id') ?? '',
  };
}
const isRequesterRole = (r: string) => ['SV', 'GV', 'NV'].includes(r);

/** MSW handlers implementing the M31 API contract (feature-plan App. A) + the §2 state machine. */
export const handlers = [
  http.get(`${base}/healthz`, () => ok({ status: 'ok' })),

  http.get(`${base}/categories`, () => ok(categories)),
  http.get(`${base}/departments`, () => ok(departments)),
  http.get(`${base}/agents`, () => ok(agents)),

  // ---- Admin: flat category list (S8). Routing rules were removed; agents/
  // leads now pick the dept independently when forwarding.
  http.post(`${base}/categories`, async ({ request }) => {
    const { name } = (await request.json()) as { name?: string };
    const trimmed = (name ?? '').trim();
    if (trimmed.length < 2) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { name: 'Tên danh mục tối thiểu 2 ký tự' });
    }
    if (categories.some((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { name: 'Tên danh mục đã tồn tại' });
    }
    const cat = { id: nextId('cat'), name: trimmed, isActive: true };
    categories.push(cat);
    return ok(cat, { status: 201 });
  }),

  http.patch(`${base}/categories/:id`, async ({ params, request }) => {
    const cat = categories.find((c) => c.id === params.id);
    if (!cat) return fail(404, 'not_found', 'Không tìm thấy danh mục');
    const { name, isActive } = (await request.json()) as { name?: string; isActive?: boolean };
    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { name: 'Tên danh mục tối thiểu 2 ký tự' });
      }
      if (categories.some((c) => c.id !== cat.id && c.name.trim().toLowerCase() === trimmed.toLowerCase())) {
        return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { name: 'Tên danh mục đã tồn tại' });
      }
      cat.name = trimmed;
    }
    if (isActive !== undefined) cat.isActive = isActive;
    return ok(cat);
  }),

  http.delete(`${base}/categories/:id`, ({ params }) => {
    const idx = categories.findIndex((c) => c.id === params.id);
    if (idx === -1) return fail(404, 'not_found', 'Không tìm thấy danh mục');
    categories.splice(idx, 1);
    return ok({ id: params.id as string });
  }),

  http.get(`${base}/tickets`, ({ request }) => {
    const url = new URL(request.url);
    const c = caller(request);
    let items = [...tickets];

    // Server-derived scoping (App. A) — never trust a client param.
    if (isRequesterRole(c.role)) items = items.filter((t) => t.requester.id === c.id);
    else if (c.role === 'DeptStaff') items = items.filter((t) => t.routedDepartment?.id === c.deptId);
    else if (c.role === 'HelpdeskAgent') items = items.filter((t) => t.helpdeskAssignee?.id === c.id);
    // Helpdesk Lead / Admin (or no role in tests) → all.

    const status = url.searchParams.get('status');
    if (status === 'open') items = items.filter((t) => t.internalStatus !== 'Closed');
    else if (status) {
      const set = new Set(status.split(','));
      items = items.filter((t) => set.has(t.internalStatus));
    }

    const severity = url.searchParams.get('severity');
    if (severity) {
      const set = new Set(severity.split(','));
      items = items.filter((t) => set.has(t.severity));
    }

    const categoryId = url.searchParams.get('categoryId');
    if (categoryId) items = items.filter((t) => t.category?.id === categoryId);

    const assigneeId = url.searchParams.get('assigneeId');
    if (assigneeId) items = items.filter((t) => t.helpdeskAssignee?.id === assigneeId);

    const q = url.searchParams.get('q');
    if (q) {
      const needle = q.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          t.description.toLowerCase().includes(needle),
      );
    }

    const sort = url.searchParams.get('sort') ?? '-createdAt';
    items.sort((a, b) => {
      switch (sort) {
        case 'createdAt':
          return a.createdAt.localeCompare(b.createdAt);
        case 'severity':
          return SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order;
        case '-severity':
          return SEVERITY_META[b.severity].order - SEVERITY_META[a.severity].order;
        case '-createdAt':
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
    const total = items.length;
    const start = (page - 1) * pageSize;
    return ok({ items: items.slice(start, start + pageSize), page: { page, pageSize, total } });
  }),

  http.get(`${base}/tickets/:id`, ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    const c = caller(request);
    if (isRequesterRole(c.role) && t.requester.id !== c.id) {
      return fail(403, 'forbidden', 'Bạn không có quyền xem yêu cầu này');
    }
    if (c.role === 'DeptStaff' && t.routedDepartment?.id !== c.deptId) {
      return fail(403, 'forbidden', 'Yêu cầu không thuộc phòng ban của bạn');
    }
    if (c.role === 'HelpdeskAgent' && t.helpdeskAssignee?.id !== c.id) {
      return fail(403, 'forbidden', 'Yêu cầu chưa được gán cho bạn');
    }
    return ok(t);
  }),

  http.get(`${base}/tickets/:id/history`, ({ params }) => ok(events[params.id as string] ?? [])),

  http.post(`${base}/tickets`, async ({ request }) => {
    const c = caller(request);
    const form = await request.formData();
    const title = String(form.get('title') ?? '');
    const description = String(form.get('description') ?? '');
    const rawSeverity = String(form.get('severity') ?? '');
    const categoryId = form.get('categoryId') ? String(form.get('categoryId')) : null;

    if (title.trim().length < 3) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', {
        title: 'Tiêu đề tối thiểu 3 ký tự',
      });
    }
    // Severity is optional (Lead/Agent triages); if a client sends one but
    // it's not a valid value, reject — otherwise default to Medium.
    if (rawSeverity && !SEVERITIES.includes(rawSeverity as Severity)) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', {
        severity: 'Mức độ không hợp lệ',
      });
    }
    const severity: Severity = (rawSeverity as Severity) || 'Medium';

    const ticket = makeTicket({
      title,
      description,
      severity,
      categoryId,
      requesterId: c.id || 'u-sv',
    });
    tickets.unshift(ticket);
    appendEvent(ticket.id, {
      type: 'Created',
      actor: ticket.requester,
      toStatus: 'Pending',
      createdAt: ticket.createdAt,
    });
    return ok(ticket, { status: 201 });
  }),

  http.post(`${base}/tickets/:id/comments`, async ({ params, request }) => {
    const ticket = tickets.find((x) => x.id === params.id);
    if (!ticket) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    const c = caller(request);
    const form = await request.formData();
    const body = String(form.get('body') ?? '');
    if (body.trim().length < 1) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', {
        body: 'Nội dung không được trống',
      });
    }
    const comment: TicketComment = {
      id: nextId('cm'),
      ticketId: ticket.id,
      author: USERS[c.id] ?? ticket.requester,
      body,
      createdAt: new Date().toISOString(),
      attachments: [],
    };
    (comments[ticket.id] ??= []).push(comment);
    appendEvent(ticket.id, { type: 'Commented', actor: comment.author, note: body });
    return ok(comment, { status: 201 });
  }),

  http.patch(`${base}/tickets/:id/severity`, async ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    if (t.internalStatus === 'Closed') return fail(409, 'conflict', 'Yêu cầu đã đóng.');
    const { severity } = (await request.json()) as { severity?: string };
    if (!SEVERITIES.includes(severity as Severity)) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { severity: 'Mức độ không hợp lệ' });
    }
    const from = t.severity;
    t.severity = severity as Severity;
    t.updatedAt = new Date().toISOString();
    appendEvent(t.id, { type: 'SeverityChanged', actor: HELPDESK_ACTOR, note: `${from} → ${severity}` });
    return ok(t);
  }),

  // Helpdesk (Lead/Agent) re-categorises a ticket. Quiet update — no event,
  // no notifications. `categoryId: null` clears the category.
  http.patch(`${base}/tickets/:id/category`, async ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    if (t.internalStatus === 'Closed') return fail(409, 'conflict', 'Yêu cầu đã đóng.');
    const { categoryId } = (await request.json()) as { categoryId?: string | null };
    if (categoryId === undefined) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', {
        categoryId: 'Thiếu danh mục',
      });
    }
    if (categoryId !== null) {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) {
        return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', {
          categoryId: 'Danh mục không tồn tại',
        });
      }
      t.category = cat;
    } else {
      t.category = null;
    }
    t.updatedAt = new Date().toISOString();
    return ok(t);
  }),

  http.post(`${base}/tickets/:id/assign`, async ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    if (t.internalStatus === 'Closed') return fail(409, 'conflict', 'Yêu cầu đã đóng, không thể gán.');
    const { agentId } = (await request.json()) as { agentId?: string };
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { agentId: 'Nhân viên không hợp lệ' });
    }
    const reassigned = !!t.helpdeskAssignee;
    t.helpdeskAssignee = agent;
    t.updatedAt = new Date().toISOString();
    appendEvent(t.id, {
      type: 'AgentAssigned',
      actor: HELPDESK_ACTOR,
      note: reassigned ? `Gán lại cho ${agent.displayName}` : `Gán cho ${agent.displayName}`,
    });
    return ok(t);
  }),

  http.post(`${base}/tickets/:id/forward`, async ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    if (t.internalStatus !== 'Pending') {
      return fail(409, 'conflict', 'Không thể chuyển ở trạng thái hiện tại.');
    }
    const { departmentId } = (await request.json()) as { departmentId?: string };
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) {
      return fail(422, 'validation_error', 'Dữ liệu không hợp lệ', { departmentId: 'Phòng ban không hợp lệ' });
    }
    const fromStatus = t.internalStatus;
    const fromDeptId = t.routedDepartment?.id ?? null;
    t.routedDepartment = dept;
    setStatus(t, 'Assigned');
    appendEvent(t.id, {
      type: 'Forwarded',
      actor: HELPDESK_ACTOR,
      fromStatus,
      toStatus: 'Assigned',
      fromDepartmentId: fromDeptId,
      toDepartmentId: dept.id,
    });
    return ok(t);
  }),

  http.post(`${base}/tickets/:id/progress`, ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    const c = caller(request);
    if (c.role === 'DeptStaff' && t.routedDepartment?.id !== c.deptId) {
      return fail(403, 'forbidden', 'Yêu cầu không thuộc phòng ban của bạn');
    }
    if (t.internalStatus !== 'Assigned') {
      return fail(409, 'conflict', 'Chỉ có thể bắt đầu xử lý khi đã giao phòng ban.');
    }
    appendEvent(t.id, { type: 'Started', actor: HELPDESK_ACTOR, fromStatus: 'Assigned', toStatus: 'InProgress' });
    setStatus(t, 'InProgress');
    return ok(t);
  }),

  http.post(`${base}/tickets/:id/close`, async ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return fail(404, 'not_found', 'Không tìm thấy yêu cầu');
    if (t.internalStatus === 'Closed') return fail(409, 'conflict', 'Yêu cầu đã đóng.');
    const body = (await request.json().catch(() => ({}))) as { note?: string };
    const note = body?.note ? String(body.note) : null;
    const fromStatus = t.internalStatus;
    appendEvent(t.id, { type: 'Closed', actor: HELPDESK_ACTOR, fromStatus, toStatus: 'Closed', note });
    setStatus(t, 'Closed');
    // Notify the requester (TICKET_CLOSED).
    notifications.unshift({
      id: nextId('nt'),
      userId: t.requester.id,
      type: 'TicketClosed',
      ticketId: t.id,
      payload: { code: t.code },
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return ok(t);
  }),

  http.get(`${base}/notifications`, ({ request }) => {
    const c = caller(request);
    const mine = notifications
      .filter((n) => !c.id || n.userId === c.id)
      .map(({ userId, ...rest }) => {
        void userId;
        return rest;
      });
    return ok(mine);
  }),

  http.post(`${base}/notifications/:id/read`, ({ params }) => {
    const n = notifications.find((x) => x.id === params.id);
    if (!n) return fail(404, 'not_found', 'Không tìm thấy thông báo');
    n.readAt = new Date().toISOString();
    const { userId, ...rest } = n;
    void userId;
    return ok(rest);
  }),

  http.get(`${base}/analytics/summary`, () => {
    const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 } as Record<Severity, number>;
    const byStatus = { Pending: 0, Assigned: 0, InProgress: 0, Closed: 0 };
    const deptCounts = new Map<string, number>();
    const catCounts = new Map<string, number>();
    let closed = 0;
    for (const t of tickets) {
      bySeverity[t.severity] += 1;
      byStatus[t.internalStatus] += 1;
      if (t.internalStatus === 'Closed') closed += 1;
      if (t.routedDepartment) deptCounts.set(t.routedDepartment.id, (deptCounts.get(t.routedDepartment.id) ?? 0) + 1);
      if (t.category) catCounts.set(t.category.id, (catCounts.get(t.category.id) ?? 0) + 1);
    }
    const summary: AnalyticsSummary = {
      total: tickets.length,
      open: tickets.length - closed,
      closed,
      avgHandlingDays: 2.4,
      bySeverity,
      byStatus,
      byDepartment: departments.map((d) => ({
        departmentId: d.id,
        name: d.name,
        count: deptCounts.get(d.id) ?? 0,
      })),
      byCategory: categories.map((c) => ({
        categoryId: c.id,
        name: c.name,
        count: catCounts.get(c.id) ?? 0,
      })),
    };
    return ok(summary);
  }),
];
