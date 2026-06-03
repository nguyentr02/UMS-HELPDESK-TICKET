import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { NotificationList } from '@/components/notifications/notification-list';
import type { NotificationItem } from '@/lib/types/domain';

vi.mock('next/link', () => ({
  default: ({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function notifs(data: NotificationItem[]) {
  server.use(
    http.get(`${base}/notifications`, () => HttpResponse.json({ data, error: null, requestId: 'r' })),
  );
}

describe('NotificationList (S9)', () => {
  it('S9-E2: a daily reminder renders its backlog tickets with severity + age', async () => {
    notifs([
      {
        id: 'n-rem',
        type: 'DailyReminder',
        ticketId: null,
        payload: {
          tickets: [
            { ticketId: 'tk-9', code: 'HD-2026-000009', severity: 'High', backlogAgeDays: 3 },
            { ticketId: 'tk-10', code: 'HD-2026-000010', severity: 'Critical', backlogAgeDays: 5 },
          ],
        },
        readAt: null,
        createdAt: '2026-05-28T02:00:00Z',
      },
    ]);
    renderWithProviders(<NotificationList />, { role: 'HelpdeskAgent' });

    expect(await screen.findByText('Bạn có 2 yêu cầu tồn đọng cần xử lý.')).toBeInTheDocument();
    expect(screen.getByText('HD-2026-000009')).toBeInTheDocument();
    expect(screen.getByText('· 3 ngày')).toBeInTheDocument();
    expect(screen.getByText('· 5 ngày')).toBeInTheDocument();
  });

});
