import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import type { AnalyticsSummary, NotificationItem, Ticket } from '@/lib/types/domain';
import { TicketForm } from '@/components/tickets/ticket-form';
import { TicketList } from '@/components/tickets/ticket-list';
import { HelpdeskQueue } from '@/components/helpdesk/helpdesk-queue';
import { Dashboard } from '@/components/analytics/dashboard';
import { NotificationList } from '@/components/notifications/notification-list';
import { CategoryManager } from '@/components/admin/category-manager';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({
  default: ({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

// Component-level surfaces render without page landmarks and jsdom can't compute
// layout, so the two rules that need those are out of scope here (covered by the
// Playwright @axe-core page sweep instead). Everything else must be clean.
const AXE_OPTS = {
  rules: { region: { enabled: false }, 'color-contrast': { enabled: false } },
} as const;

// vitest-axe 0.1.0's matcher typings are broken, so assert on the results directly
// (mapping to rule ids gives a readable failure if a violation slips in).
async function expectNoViolations(container: Element) {
  const results = await axe(container, AXE_OPTS);
  expect(results.violations.map((v) => v.id)).toEqual([]);
}

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Wifi chậm khu B',
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

function ticketList(items: Ticket[]) {
  server.use(
    http.get(`${base}/tickets`, () =>
      HttpResponse.json({ data: { items, page: { page: 1, pageSize: 20, total: items.length } }, error: null, requestId: 'r' }),
    ),
  );
}

describe('Accessibility sweep (Phase 7 — 0 violations)', () => {
  it('TicketForm (create) has no a11y violations', async () => {
    const { container } = renderWithProviders(<TicketForm />, { role: 'SV' });
    await screen.findByText('Tiêu đề');
    await expectNoViolations(container);
  });

  it('TicketList has no a11y violations', async () => {
    ticketList([ticket()]);
    const { container } = renderWithProviders(<TicketList />, { role: 'SV' });
    await screen.findByRole('table');
    await expectNoViolations(container);
  });

  it('HelpdeskQueue has no a11y violations', async () => {
    ticketList([ticket({ internalStatus: 'Assigned' })]);
    server.use(http.get(`${base}/agents`, () => HttpResponse.json({ data: [], error: null, requestId: 'r' })));
    const { container } = renderWithProviders(<HelpdeskQueue />, { role: 'HelpdeskLead' });
    await screen.findByRole('table');
    await expectNoViolations(container);
  });

  it('Dashboard has no a11y violations', async () => {
    const summary: AnalyticsSummary = {
      total: 5,
      open: 4,
      closed: 1,
      avgHandlingDays: 2.4,
      bySeverity: { Critical: 1, High: 2, Medium: 1, Low: 1 },
      byStatus: { Pending: 2, Assigned: 1, InProgress: 1, CloseRequested: 0, Closed: 1 },
      byDepartment: [{ departmentId: 'dep-it', name: 'CAIRA / Phòng IT', count: 3 }],
      byCategory: [{ categoryId: 'cat-it', name: 'IT / Hệ thống số', count: 4 }],
    };
    server.use(
      http.get(`${base}/analytics/summary`, () => HttpResponse.json({ data: summary, error: null, requestId: 'r' })),
    );
    const { container } = renderWithProviders(<Dashboard />, { role: 'HelpdeskLead' });
    await screen.findByText('Tổng yêu cầu');
    await expectNoViolations(container);
  });

  it('NotificationList has no a11y violations', async () => {
    const items: NotificationItem[] = [
      {
        id: 'n1',
        type: 'TicketClosed',
        ticketId: 'tk-1',
        payload: { code: 'HD-2026-000001' },
        readAt: null,
        createdAt: '2026-05-28T00:00:00Z',
      },
    ];
    server.use(
      http.get(`${base}/notifications`, () => HttpResponse.json({ data: items, error: null, requestId: 'r' })),
    );
    const { container } = renderWithProviders(<NotificationList />, { role: 'SV' });
    await screen.findByText('Yêu cầu HD-2026-000001 đã được xử lý xong.');
    await expectNoViolations(container);
  });

  it('CategoryManager (Admin) has no a11y violations', async () => {
    const { container } = renderWithProviders(<CategoryManager />, { role: 'Admin' });
    await screen.findByRole('list', { name: 'Danh sách danh mục' });
    await expectNoViolations(container);
  });
});
