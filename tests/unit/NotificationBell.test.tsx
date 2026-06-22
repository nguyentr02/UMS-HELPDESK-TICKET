import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { NotificationBell } from '@/components/notifications/notification-bell';
import type { NotificationItem } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

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

const unreadClose: NotificationItem = {
  id: 'n1',
  type: 'TicketClosed',
  ticketId: 'tk-1',
  payload: { code: 'HD-2026-000001' },
  readAt: null,
  createdAt: '2026-05-28T00:00:00Z',
};

// The panel is a shadcn DropdownMenu (Radix) — the open→list→navigate flow runs in Playwright
// (tests/e2e/notifications.spec.ts). jsdom covers the unread badge on the trigger (no open needed).
describe('NotificationBell (S9)', () => {
  it('S9-H1: shows an unread count on the bell', async () => {
    notifs([unreadClose]);
    renderWithProviders(<NotificationBell />, { role: 'SV' });
    const bell = await screen.findByRole('button', { name: 'Thông báo (1 chưa đọc)' });
    expect(within(bell).getByText('1')).toBeInTheDocument();
  });

  it('S9-E1: zero notifications → no unread badge', async () => {
    notifs([]);
    renderWithProviders(<NotificationBell />, { role: 'SV' });
    const bell = await screen.findByRole('button', { name: 'Thông báo' });
    expect(within(bell).queryByText('1')).not.toBeInTheDocument();
  });
});
