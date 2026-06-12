import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { HelpdeskTicketDetail } from '@/components/helpdesk/helpdesk-ticket-detail';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Wifi chậm',
    description: 'mô tả',
    severity: 'High',
    internalStatus: 'Pending',
    externalStatus: 'Requested',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: null,
    routedDepartment: null,
    attachments: [],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
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

describe('HelpdeskTicketDetail (S2/S3/S7 gating)', () => {
  it('S2: a requester (SV) is denied access', async () => {
    mockTicket(ticket());
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  it('S3-H1: a Lead sees "Gán nhân viên"', async () => {
    mockTicket(ticket({ internalStatus: 'Pending' }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskLead' });
    expect(await screen.findByRole('button', { name: 'Gán nhân viên' })).toBeInTheDocument();
  });

  it('S3-X1: an Agent does not see "Gán nhân viên"', async () => {
    mockTicket(ticket({ internalStatus: 'Pending' }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskAgent' });
    await screen.findByText('Wifi chậm');
    expect(screen.queryByRole('button', { name: 'Gán nhân viên' })).not.toBeInTheDocument();
  });

  it('S7-X3: an Agent who is not the assignee sees no Close control', async () => {
    mockTicket(ticket({ internalStatus: 'InProgress', helpdeskAssignee: { id: 'u-hda2', displayName: 'Other' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskAgent' });
    await screen.findByText('Wifi chậm');
    expect(screen.queryByRole('button', { name: 'Đóng yêu cầu' })).not.toBeInTheDocument();
  });

  it('S7: the assigned Agent sees the Close control', async () => {
    mockTicket(ticket({ internalStatus: 'InProgress', helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskAgent' });
    expect(await screen.findByRole('button', { name: 'Đóng yêu cầu' })).toBeInTheDocument();
  });

  it('a Closed ticket exposes no action controls', async () => {
    mockTicket(ticket({ internalStatus: 'Closed' }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskLead' });
    await screen.findByText('Wifi chậm');
    expect(screen.queryByRole('button', { name: 'Gán nhân viên' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đóng yêu cầu' })).not.toBeInTheDocument();
  });

  it('M31-FE-S17-G4: a Lead on a CloseRequested ticket sees "Duyệt đóng" + "Từ chối"', async () => {
    mockTicket(ticket({ internalStatus: 'CloseRequested', helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskLead' });
    expect(await screen.findByRole('button', { name: 'Duyệt đóng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument();
    // The direct close + assign controls are hidden in this paused state.
    expect(screen.queryByRole('button', { name: 'Đóng yêu cầu' })).not.toBeInTheDocument();
  });

  it('M31-FE-S17-G5: the assigned Agent sees the review controls', async () => {
    mockTicket(ticket({ internalStatus: 'CloseRequested', helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskAgent' });
    expect(await screen.findByRole('button', { name: 'Duyệt đóng' })).toBeInTheDocument();
  });

  it('M31-FE-S17-G6: an Agent who is NOT the assignee sees no review controls', async () => {
    mockTicket(ticket({ internalStatus: 'CloseRequested', helpdeskAssignee: { id: 'u-hda2', displayName: 'Other' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskAgent' });
    await screen.findByText('Wifi chậm');
    expect(screen.queryByRole('button', { name: 'Duyệt đóng' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Từ chối' })).not.toBeInTheDocument();
  });

  it('M31-FE-S18-G1: a Lead on an Assigned ticket sees "Chuyển phòng khác" (redirect)', async () => {
    mockTicket(ticket({ internalStatus: 'Assigned', routedDepartment: { id: 'dep-csvc', code: 'CSVC', name: 'CSVC' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskLead' });
    expect(await screen.findByRole('button', { name: 'Chuyển phòng khác' })).toBeInTheDocument();
  });

  it('M31-FE-S18-G2: redirect is hidden on a Pending ticket (use Forward for first routing)', async () => {
    mockTicket(ticket({ internalStatus: 'Pending' }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskLead' });
    await screen.findByText('Wifi chậm');
    expect(screen.queryByRole('button', { name: 'Chuyển phòng khác' })).not.toBeInTheDocument();
  });

  it('M31-FE-S19-G3: a Lead on a RedirectRequested ticket sees "Duyệt chuyển" + "Từ chối"', async () => {
    mockTicket(ticket({ internalStatus: 'RedirectRequested', helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' }, routedDepartment: { id: 'dep-csvc', code: 'CSVC', name: 'CSVC' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskLead' });
    expect(await screen.findByRole('button', { name: 'Duyệt chuyển' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument();
    // Direct redirect + close are hidden in this paused state.
    expect(screen.queryByRole('button', { name: 'Chuyển phòng khác' })).not.toBeInTheDocument();
  });

  it('M31-FE-S19-G4: a non-assignee Agent sees no redirect-review controls', async () => {
    mockTicket(ticket({ internalStatus: 'RedirectRequested', helpdeskAssignee: { id: 'u-hda2', displayName: 'Other' } }));
    renderWithProviders(<HelpdeskTicketDetail id="tk-1" />, { role: 'HelpdeskAgent' });
    await screen.findByText('Wifi chậm');
    expect(screen.queryByRole('button', { name: 'Duyệt chuyển' })).not.toBeInTheDocument();
  });
});
