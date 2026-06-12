import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RequestRedirectDialog } from '@/components/staff/request-redirect-dialog';
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

describe('RequestRedirectDialog (S19)', () => {
  it('M31-FE-S19-H1: submitting a reason sends POST /request-redirect + toasts success', async () => {
    const captured: { reason?: string } = {};
    server.use(
      http.post(`${base}/tickets/tk-1/request-redirect`, async ({ request }) => {
        Object.assign(captured, (await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<RequestRedirectDialog ticket={inProgressTicket()} />, { role: 'DeptStaff' });

    await user.click(screen.getByRole('button', { name: 'Xin chuyển phòng ban' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Lý do xin chuyển phòng ban'), 'Không thuộc phòng tôi');
    await user.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu' }));

    await waitFor(() => expect(captured.reason).toBe('Không thuộc phòng tôi'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('M31-FE-S19-E1: an empty reason shows an inline error and sends no request', async () => {
    let posted = false;
    server.use(
      http.post(`${base}/tickets/tk-1/request-redirect`, () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<RequestRedirectDialog ticket={inProgressTicket()} />, { role: 'DeptStaff' });

    await user.click(screen.getByRole('button', { name: 'Xin chuyển phòng ban' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu' }));

    expect(await screen.findByText('Cần lý do xin chuyển phòng ban')).toBeInTheDocument();
    expect(posted).toBe(false);
  });
});