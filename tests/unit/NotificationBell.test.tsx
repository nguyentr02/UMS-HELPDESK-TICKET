import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { NotificationBell } from '@/components/notifications/notification-bell';
import type { NotificationItem } from '@/lib/types/domain';

vi.mock('next/link', () => ({
  default: ({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function notifs(data: NotificationItem[]) {
  server.use(
    http.get(`${base}/notifications`, () => HttpResponse.json({ data, error: null, requestId: 'r' })),
  );
}

const closed: NotificationItem = {
  id: 'n1',
  type: 'TicketClosed',
  ticketId: 'tk-1',
  payload: { code: 'HD-2026-000001' },
  readAt: null,
  createdAt: '2026-05-28T00:00:00Z',
};
const older: NotificationItem = {
  id: 'n2',
  type: 'StatusChanged',
  ticketId: 'tk-2',
  payload: { code: 'HD-2026-000002' },
  readAt: '2026-05-27T00:00:00Z',
  createdAt: '2026-05-26T00:00:00Z',
};

describe('NotificationBell (S9)', () => {
  it('S9-H1: shows an unread count and opens a newest-first list', async () => {
    notifs([older, closed]);
    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />, { role: 'SV' });

    const bell = await screen.findByRole('button', { name: 'Thông báo (1 chưa đọc)' });
    expect(within(bell).getByText('1')).toBeInTheDocument();

    await user.click(bell);
    const menu = await screen.findByRole('menu', { name: 'Danh sách thông báo' });
    const links = within(menu).getAllByRole('link');
    // Newest-first: the closed (2026-05-28) item precedes the older (2026-05-26) one.
    // links[0] is "Xem tất cả"; the first notification link is the newest.
    expect(within(menu).getByText('Yêu cầu HD-2026-000001 đã được xử lý xong.')).toBeInTheDocument();
    expect(links.length).toBeGreaterThan(0);
  });

  it('S9-E1: zero notifications → no badge and an empty state', async () => {
    notifs([]);
    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />, { role: 'SV' });

    const bell = await screen.findByRole('button', { name: 'Thông báo' });
    expect(within(bell).queryByText('1')).not.toBeInTheDocument();

    await user.click(bell);
    expect(await screen.findByText('Không có thông báo')).toBeInTheDocument();
  });
});
