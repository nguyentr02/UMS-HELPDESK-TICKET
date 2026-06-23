import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RelatedTickets } from '@/components/tickets/related-tickets';
import type { Ticket } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function ticket(over: Partial<Ticket>): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Ticket',
    description: '',
    severity: 'High',
    internalStatus: 'Pending',
    externalStatus: 'Requested',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: null,
    routedDepartment: null,
    attachments: [],
    createdAt: '2026-05-25T00:00:00Z',
    updatedAt: '2026-05-25T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
    ...over,
  };
}

describe('RelatedTickets', () => {
  it("lists the user's other open tickets, excluding the current one", async () => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: {
            items: [ticket({ id: 'tk-1', title: 'Yêu cầu hiện tại' }), ticket({ id: 'tk-2', title: 'Yêu cầu khác A' })],
            page: { page: 1, pageSize: 50, total: 2 },
          },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<RelatedTickets currentId="tk-1" />, { role: 'SV' });
    expect(await screen.findByText('Yêu cầu khác A')).toBeInTheDocument();
    expect(screen.queryByText('Yêu cầu hiện tại')).not.toBeInTheDocument();
  });

  it('caps the list at 5 and shows a "see all" link when there are more', async () => {
    const items = [
      ticket({ id: 'tk-1', title: 'Yêu cầu hiện tại' }),
      ...Array.from({ length: 6 }, (_, i) => ticket({ id: `tk-${i + 2}`, title: `Khác ${i + 1}` })),
    ];
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: { items, page: { page: 1, pageSize: 6, total: 7 } },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<RelatedTickets currentId="tk-1" />, { role: 'SV' });
    expect(await screen.findByText('Khác 1')).toBeInTheDocument();
    expect(screen.getByText('Khác 5')).toBeInTheDocument();
    // 6th (and beyond) is hidden behind the "see all" link.
    expect(screen.queryByText('Khác 6')).not.toBeInTheDocument();
    expect(screen.getByText('Xem tất cả →')).toBeInTheDocument();
  });

  it('shows the empty message when there are no other open tickets', async () => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: { items: [ticket({ id: 'tk-1', title: 'Yêu cầu hiện tại' })], page: { page: 1, pageSize: 50, total: 1 } },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<RelatedTickets currentId="tk-1" />, { role: 'SV' });
    expect(await screen.findByText('Không còn yêu cầu nào khác.')).toBeInTheDocument();
  });
});