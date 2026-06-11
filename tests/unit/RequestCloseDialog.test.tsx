import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RequestCloseDialog } from '@/components/staff/request-close-dialog';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function inProgressTicket(): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Mất điện A1',
    description: '',
    severity: 'High',
    internalStatus: 'InProgress',
    externalStatus: 'Processing',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' },
    routedDepartment: { id: 'dep-csvc', code: 'CSVC', name: 'CSVC' },
    attachments: [],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
  };
}

describe('RequestCloseDialog (S17)', () => {
  it('M31-FE-S17-H1: submitting a note sends POST /request-close + toasts success', async () => {
    let captured: { note?: string } | null = null;
    server.use(
      http.post(`${base}/tickets/tk-1/request-close`, async ({ request }) => {
        captured = (await request.json()) as { note?: string };
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<RequestCloseDialog ticket={inProgressTicket()} />, { role: 'DeptStaff' });

    await user.click(screen.getByRole('button', { name: 'Yêu cầu đóng' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Mô tả công việc đã hoàn thành'), 'Đã thay router');
    await user.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu đóng' }));

    await waitFor(() => expect(captured?.note).toBe('Đã thay router'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('M31-FE-S17-E1: an empty note shows an inline error and sends no request', async () => {
    let posted = false;
    server.use(
      http.post(`${base}/tickets/tk-1/request-close`, () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<RequestCloseDialog ticket={inProgressTicket()} />, { role: 'DeptStaff' });

    await user.click(screen.getByRole('button', { name: 'Yêu cầu đóng' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu đóng' }));

    expect(await screen.findByText('Cần mô tả công việc đã hoàn thành')).toBeInTheDocument();
    expect(posted).toBe(false);
  });
});