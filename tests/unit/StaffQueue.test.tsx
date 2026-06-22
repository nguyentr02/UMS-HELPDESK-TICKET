import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StaffQueue } from '@/components/staff/staff-queue';
import type { Ticket } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Máy chiếu hỏng',
    description: '',
    severity: 'Medium',
    internalStatus: 'Assigned',
    externalStatus: 'Requested',
    category: null,
    requester: { id: 'u-gv', displayName: 'GV Trần Văn B' },
    helpdeskAssignee: { id: 'u-hda', displayName: 'Đỗ Thị Mai' },
    routedDepartment: { id: 'dep-csvc', code: 'CSVC', name: 'Phòng Quản trị CSVC' },
    attachments: [],
    createdAt: '2026-05-28T00:00:00Z',
    updatedAt: '2026-05-28T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
    ...over,
  };
}

describe('StaffQueue (S6)', () => {
  it('S6-E1: renders the department queue with internal status + requester', async () => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({
          data: { items: [ticket()], page: { page: 1, pageSize: 20, total: 1 } },
          error: null,
          requestId: 'r',
        }),
      ),
    );
    renderWithProviders(<StaffQueue />, { role: 'DeptStaff' });
    // Dual (mobile cards + desktop table) layout → scope assertions to the table.
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Máy chiếu hỏng')).toBeInTheDocument();
    expect(within(table).getByText('Đã giao phòng ban')).toBeInTheDocument();
    expect(within(table).getByText('GV Trần Văn B')).toBeInTheDocument();
  });

  it('S2: a non-DeptStaff role (SV) is denied the dept queue', async () => {
    renderWithProviders(<StaffQueue />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });
});
