import { describe, it, expect, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/** Stub GET /tickets and capture each request's URL (to assert filter params). */
function captureTickets(items: Ticket[] = []) {
  const urls: string[] = [];
  server.use(
    http.get(`${base}/tickets`, ({ request }) => {
      urls.push(request.url);
      return HttpResponse.json(
        { data: { items, page: { page: 1, pageSize: 20, total: items.length } }, error: null, requestId: 'r' },
      );
    }),
  );
  return urls;
}
const lastParams = (urls: string[]) => new URL(urls[urls.length - 1]).searchParams;

describe('TicketList', () => {
  it('renders rows with external status labels', async () => {
    captureTickets([
      sampleTicket(),
      sampleTicket({
        id: 'tk-2',
        code: 'HD-2026-000002',
        title: 'Wifi chậm',
        severity: 'Low',
        internalStatus: 'Pending',
        externalStatus: 'Requested',
      }),
    ]);
    renderWithProviders(<TicketList />, { role: 'SV' });
    // Dual layout (table + mobile cards) + status filter chips share label text → scope to the table.
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Mất điện')).toBeInTheDocument();
    expect(within(table).getByText('Wifi chậm')).toBeInTheDocument();
    expect(within(table).getByText('Đang xử lý')).toBeInTheDocument();
    expect(within(table).getByText('Đã tiếp nhận')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    captureTickets([]);
    renderWithProviders(<TicketList />, { role: 'SV' });
    expect(await screen.findByText('Không có yêu cầu nào khớp')).toBeInTheDocument();
  });

  describe('filter engine', () => {
    it('maps an external status chip to the internal statuses the API expects', async () => {
      const urls = captureTickets([]);
      const user = userEvent.setup();
      renderWithProviders(<TicketList />, { role: 'SV' });
      await screen.findByText('Không có yêu cầu nào khớp');

      await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
      await user.click(screen.getByRole('button', { name: 'Đang xử lý' }));
      await waitFor(() => expect(lastParams(urls).get('status')).toBe('InProgress'));

      // "Đã tiếp nhận" spans the Pending + Assigned internal states.
      await user.click(screen.getByRole('button', { name: 'Đã tiếp nhận' }));
      await waitFor(() => expect(lastParams(urls).get('status')).toBe('InProgress,Pending,Assigned'));
    });

    it('sends the selected severity', async () => {
      const urls = captureTickets([]);
      const user = userEvent.setup();
      renderWithProviders(<TicketList />, { role: 'SV' });
      await screen.findByText('Không có yêu cầu nào khớp');

      await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
      await user.click(screen.getByRole('button', { name: 'High' }));
      await waitFor(() => expect(lastParams(urls).get('severity')).toBe('High'));
    });

    it('sends the search query', async () => {
      const urls = captureTickets([]);
      const user = userEvent.setup();
      renderWithProviders(<TicketList />, { role: 'SV' });
      await screen.findByText('Không có yêu cầu nào khớp');

      await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
      await user.type(screen.getByLabelText('Tìm theo tiêu đề hoặc mô tả'), 'wifi');
      await waitFor(() => expect(lastParams(urls).get('q')).toBe('wifi'));
    });

    it('clears all active filters', async () => {
      const urls = captureTickets([]);
      const user = userEvent.setup();
      renderWithProviders(<TicketList />, { role: 'SV' });
      await screen.findByText('Không có yêu cầu nào khớp');

      await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
      await user.click(screen.getByRole('button', { name: 'Đang xử lý' }));
      await waitFor(() => expect(lastParams(urls).get('status')).toBe('InProgress'));

      await user.click(screen.getByRole('button', { name: 'Xóa lọc' }));
      await waitFor(() => expect(lastParams(urls).get('status')).toBeNull());
    });
  });
});
