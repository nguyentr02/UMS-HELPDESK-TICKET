import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { TicketList } from '@/components/tickets/ticket-list';
import type { Ticket } from '@/lib/types/domain';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function sampleTicket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Mất điện',
    description: '',
    severity: 'High',
    internalStatus: 'InProgress',
    externalStatus: 'Processing',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: null,
    routedDepartment: null,
    attachments: [],
    createdAt: '2026-05-25T00:00:00Z',
    updatedAt: '2026-05-25T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 2,
    ...over,
  };
}

describe('TicketList', () => {
  it('renders rows with external status labels', async () => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: {
            items: [
              sampleTicket(),
              sampleTicket({
                id: 'tk-2',
                code: 'HD-2026-000002',
                title: 'Wifi chậm',
                severity: 'Low',
                internalStatus: 'Pending',
                externalStatus: 'Requested',
              }),
            ],
            page: { page: 1, pageSize: 20, total: 2 },
          },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<TicketList />, { role: 'SV' });
    expect(await screen.findByText('Mất điện')).toBeInTheDocument();
    expect(screen.getByText('Wifi chậm')).toBeInTheDocument();
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
    expect(screen.getByText('Đã tiếp nhận')).toBeInTheDocument();
  });

  it('shows an empty state when there are no tickets', async () => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: { items: [], page: { page: 1, pageSize: 20, total: 0 } },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<TicketList />, { role: 'SV' });
    expect(await screen.findByText('Chưa có yêu cầu nào')).toBeInTheDocument();
  });
});
