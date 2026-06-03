import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { TicketDetail } from '@/components/tickets/ticket-detail';
import type { Ticket, TicketEvent } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const ticket: Ticket = {
  id: 'tk-9',
  code: 'HD-2026-000009',
  title: 'Mất điện phòng A1',
  description: 'Phòng A1 mất điện từ sáng.',
  severity: 'High',
  internalStatus: 'InProgress',
  externalStatus: 'Processing',
  category: { id: 'cat-csvc', name: 'Cơ sở vật chất (CSVC)', isActive: true },
  requester: { id: 'u-sv', displayName: 'SV Nguyễn Văn A' },
  helpdeskAssignee: null,
  routedDepartment: null,
  attachments: [],
  createdAt: '2026-05-25T02:00:00Z',
  updatedAt: '2026-05-25T02:00:00Z',
  closedAt: null,
  backlogAgeDays: 2,
};

const events: TicketEvent[] = [
  {
    id: 'ev1',
    ticketId: 'tk-9',
    actor: { id: 'u-sv', displayName: 'SV Nguyễn Văn A' },
    type: 'Created',
    fromStatus: null,
    toStatus: 'Pending',
    fromDepartmentId: null,
    toDepartmentId: null,
    note: null,
    createdAt: '2026-05-25T02:00:00Z',
  },
];

describe('TicketDetail', () => {
  it('S10-H1: renders the ticket header and its timeline', async () => {
    server.use(
      http.get(`${base}/tickets/tk-9`, () =>
        HttpResponse.json({ data: ticket, error: null, requestId: 'r' }),
      ),
      http.get(`${base}/tickets/tk-9/history`, () =>
        HttpResponse.json({ data: events, error: null, requestId: 'r' }),
      ),
    );
    renderWithProviders(<TicketDetail id="tk-9" />, { role: 'SV' });
    expect(await screen.findByText('Mất điện phòng A1')).toBeInTheDocument();
    expect(await screen.findByText('Tạo yêu cầu')).toBeInTheDocument();
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
  });

  it('S2-X2: shows a not-authorized message on a 403, no ticket data', async () => {
    server.use(
      http.get(`${base}/tickets/tk-x`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'forbidden', message: 'no' }, requestId: 'r' },
          { status: 403 },
        ),
      ),
      http.get(`${base}/tickets/tk-x/history`, () =>
        HttpResponse.json({ data: [], error: null, requestId: 'r' }),
      ),
    );
    renderWithProviders(<TicketDetail id="tk-x" />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền xem yêu cầu này.')).toBeInTheDocument();
  });
});
