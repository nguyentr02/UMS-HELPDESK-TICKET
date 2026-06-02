import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/** Stub GET /tickets and capture request URLs (to assert filter params). */
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
    // Dual layout (table + mobile cards) + status filter chips share label text → scope to the table.
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Wifi chậm')).toBeInTheDocument();
    expect(within(table).getByText('Chờ tiếp nhận')).toBeInTheDocument();
    expect(within(table).getByText('Chưa gán')).toBeInTheDocument();
  });

  it('S2: a requester (SV) is denied the queue', async () => {
    renderWithProviders(<HelpdeskQueue />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  describe('filter engine', () => {
    it('defaults to the open (non-Closed) statuses', async () => {
      const urls = captureTickets([]);
      renderWithProviders(<HelpdeskQueue />, { role: 'HelpdeskLead' });
      await waitFor(() => expect(urls.length).toBeGreaterThan(0));
      expect(lastParams(urls).get('status')).toBe('Pending,Assigned,InProgress,Redirected');
    });

    // The assignee/category Selects are Radix (don't open in jsdom) → their
    // open→pick interactions are covered by Playwright (tests/e2e/queue-filter.spec.ts).
    // Here we cover a status/severity chip (ToggleGroup, jsdom-safe) + the reset.
    it('toggling a severity chip filters, and Xóa lọc resets to the open default', async () => {
      const urls = captureTickets([]);
      const user = userEvent.setup();
      renderWithProviders(<HelpdeskQueue />, { role: 'HelpdeskLead' });
      await screen.findByText('Không có yêu cầu');

      await user.click(screen.getByRole('button', { name: /^Bộ lọc/ }));
      await user.click(screen.getByRole('button', { name: 'High' }));
      await waitFor(() => expect(lastParams(urls).get('severity')).toBe('High'));

      await user.click(screen.getByRole('button', { name: 'Xóa lọc' }));
      await waitFor(() => {
        const p = lastParams(urls);
        expect(p.get('severity')).toBeNull();
        expect(p.get('status')).toBe('Pending,Assigned,InProgress,Redirected');
      });
    });
  });
});
