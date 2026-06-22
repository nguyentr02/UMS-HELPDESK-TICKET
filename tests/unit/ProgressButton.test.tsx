import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ProgressButton } from '@/components/staff/progress-button';
import { CONFLICT_MESSAGE } from '@/lib/api/errors';
import type { Ticket } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function assignedTicket(): Ticket {
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
  };
}

describe('ProgressButton (S6)', () => {
  it('S6-H1: marking In Progress sends POST /progress and toasts success', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/progress`, () =>
        HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ProgressButton ticket={assignedTicket()} />, { role: 'DeptStaff' });
    await user.click(screen.getByRole('button', { name: 'Bắt đầu xử lý' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('S6-X2: a 403 (not your dept) surfaces an error toast', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/progress`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'forbidden', message: 'Yêu cầu không thuộc phòng ban của bạn' }, requestId: 'r' },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ProgressButton ticket={assignedTicket()} />, { role: 'DeptStaff' });
    await user.click(screen.getByRole('button', { name: 'Bắt đầu xử lý' }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Yêu cầu không thuộc phòng ban của bạn'),
    );
  });

  it('a 409 (no longer Assigned) shows the refresh toast', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/progress`, () =>
        HttpResponse.json({ data: null, error: { code: 'conflict', message: 'no' }, requestId: 'r' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ProgressButton ticket={assignedTicket()} />, { role: 'DeptStaff' });
    await user.click(screen.getByRole('button', { name: 'Bắt đầu xử lý' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(CONFLICT_MESSAGE));
  });
});
