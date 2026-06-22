import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect,it } from 'vitest';

import { StaffTicketDetail } from '@/components/staff/staff-ticket-detail';
import type { Ticket } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Máy chiếu hỏng',
    description: 'mô tả',
    severity: 'Medium',
    internalStatus: 'Assigned',
    externalStatus: 'Requested',
    category: null,
    requester: { id: 'u-gv', displayName: 'GV Trần Văn B' },
    helpdeskAssignee: { id: 'u-hda', displayName: 'Đỗ Thị Mai' },
    routedDepartment: { id: 'dep-csvc', code: 'CSVC', name: 'Phòng Quản trị CSVC' },
    attachments: [],
    createdAt: '2026-05-28T00:00:00Z',
    updatedAt: '2026-05-28T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
    ...over,
  };
}

function mockTicket(t: Ticket) {
  server.use(
    http.get(`${base}/tickets/${t.id}`, () => HttpResponse.json({ data: t, error: null, requestId: 'r' })),
    http.get(`${base}/tickets/${t.id}/history`, () => HttpResponse.json({ data: [], error: null, requestId: 'r' })),
  );
}

describe('StaffTicketDetail (S6 gating)', () => {
  it('S6-H1: a DeptStaff on an Assigned ticket sees "Bắt đầu xử lý"', async () => {
    mockTicket(ticket({ internalStatus: 'Assigned' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    expect(await screen.findByRole('button', { name: 'Bắt đầu xử lý' })).toBeInTheDocument();
  });

  it('S6-X1: a DeptStaff sees no Close control', async () => {
    mockTicket(ticket({ internalStatus: 'Assigned' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    await screen.findByText('Máy chiếu hỏng');
    expect(screen.queryByRole('button', { name: 'Đóng yêu cầu' })).not.toBeInTheDocument();
  });

  it('DeptStaff can comment', async () => {
    mockTicket(ticket({ internalStatus: 'Assigned' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    await screen.findByText('Máy chiếu hỏng');
    expect(screen.getByRole('button', { name: 'Gửi bình luận' })).toBeInTheDocument();
  });

  it('the progress action is hidden once the ticket is In Progress', async () => {
    mockTicket(ticket({ internalStatus: 'InProgress' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    await screen.findByText('Máy chiếu hỏng');
    expect(screen.queryByRole('button', { name: 'Bắt đầu xử lý' })).not.toBeInTheDocument();
  });

  it('S2: a requester (SV) is denied access', async () => {
    mockTicket(ticket());
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  it('M31-FE-S17-G1: DeptStaff (of routed dept) on an InProgress ticket sees "Yêu cầu đóng"', async () => {
    mockTicket(ticket({ internalStatus: 'InProgress' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    expect(await screen.findByRole('button', { name: 'Yêu cầu đóng' })).toBeInTheDocument();
  });

  it('M31-FE-S17-G2: the request-close action is hidden before In Progress (Assigned)', async () => {
    mockTicket(ticket({ internalStatus: 'Assigned' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    await screen.findByText('Máy chiếu hỏng');
    expect(screen.queryByRole('button', { name: 'Yêu cầu đóng' })).not.toBeInTheDocument();
  });

  it('M31-FE-S17-G3: a pending close request shows the "chờ Helpdesk duyệt" banner', async () => {
    mockTicket(ticket({ internalStatus: 'CloseRequested' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    expect(await screen.findByText(/đang chờ Helpdesk duyệt/i)).toBeInTheDocument();
  });

  it('M31-FE-S19-G1: DeptStaff (routed dept) on an Assigned ticket sees "Xin chuyển phòng ban"', async () => {
    mockTicket(ticket({ internalStatus: 'Assigned' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    expect(await screen.findByRole('button', { name: 'Xin chuyển phòng ban' })).toBeInTheDocument();
  });

  it('M31-FE-S19-G2: a pending redirect request shows the "chờ Helpdesk duyệt" banner', async () => {
    mockTicket(ticket({ internalStatus: 'RedirectRequested' }));
    renderWithProviders(<StaffTicketDetail id="tk-1" />, { role: 'DeptStaff' });
    expect(await screen.findByText(/yêu cầu chuyển phòng ban/i)).toBeInTheDocument();
  });
});
