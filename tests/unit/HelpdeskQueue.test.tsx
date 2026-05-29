import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { HelpdeskQueue } from '@/components/helpdesk/helpdesk-queue';
import type { Ticket } from '@/lib/types/domain';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Wifi chậm',
    description: '',
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

describe('HelpdeskQueue (S2/S3)', () => {
  it('renders tickets with internal status + assignee for Helpdesk', async () => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: { items: [ticket()], page: { page: 1, pageSize: 20, total: 1 } },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<HelpdeskQueue />, { role: 'HelpdeskLead' });
    expect(await screen.findByText('Wifi chậm')).toBeInTheDocument();
    // Scope to the table — "Chờ tiếp nhận" is also a status-filter <option>.
    const table = screen.getByRole('table');
    expect(within(table).getByText('Chờ tiếp nhận')).toBeInTheDocument();
    expect(within(table).getByText('Chưa gán')).toBeInTheDocument();
  });

  it('S2: a requester (SV) is denied the queue', async () => {
    renderWithProviders(<HelpdeskQueue />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });
});
