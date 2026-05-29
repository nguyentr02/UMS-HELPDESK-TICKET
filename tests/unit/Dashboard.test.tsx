import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { Dashboard } from '@/components/analytics/dashboard';
import type { AnalyticsSummary } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const summary: AnalyticsSummary = {
  total: 12,
  open: 9,
  closed: 3,
  avgHandlingDays: 2.4,
  bySeverity: { Critical: 2, High: 4, Medium: 3, Low: 3 },
  byStatus: { Pending: 3, Assigned: 2, InProgress: 4, Redirected: 0, Closed: 3 },
  byDepartment: [{ departmentId: 'dep-it', name: 'CAIRA / Phòng IT', count: 5 }],
  byCategory: [{ categoryId: 'cat-it', name: 'IT / Hệ thống số', count: 6 }],
};

describe('Dashboard (S10)', () => {
  it('S10-E1: renders the headline counts and breakdowns', async () => {
    server.use(
      http.get(`${base}/analytics/summary`, () =>
        HttpResponse.json({ data: summary, error: null, requestId: 'r' }),
      ),
    );
    renderWithProviders(<Dashboard />, { role: 'HelpdeskLead' });

    expect(await screen.findByText('Tổng yêu cầu')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // total
    expect(screen.getByText('CAIRA / Phòng IT')).toBeInTheDocument();
    expect(screen.getByText('IT / Hệ thống số')).toBeInTheDocument();
  });

  it('S10-X1: an API error shows an error state with a retry control', async () => {
    server.use(
      http.get(`${base}/analytics/summary`, () =>
        HttpResponse.json({ data: null, error: { code: 'server_error', message: 'x' }, requestId: 'r' }, { status: 500 }),
      ),
    );
    renderWithProviders(<Dashboard />, { role: 'HelpdeskLead' });

    expect(await screen.findByText('Không tải được số liệu. Vui lòng thử lại.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('S10-X2: a requester (SV) is denied the dashboard', async () => {
    renderWithProviders(<Dashboard />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  it('S10-X3: a Helpdesk Agent is denied the dashboard (no dashboard for Agent)', async () => {
    renderWithProviders(<Dashboard />, { role: 'HelpdeskAgent' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });
});
