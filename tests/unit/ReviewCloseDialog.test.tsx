import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { ReviewCloseDialog } from '@/components/helpdesk/review-close-dialog';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function closeRequestedTicket(): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Mất điện A1',
    description: '',
    severity: 'High',
    internalStatus: 'CloseRequested',
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

describe('ReviewCloseDialog (S17)', () => {
  it('M31-FE-S17-H2: approving sends POST /approve-close + toasts success', async () => {
    let posted = false;
    server.use(
      http.post(`${base}/tickets/tk-1/approve-close`, () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReviewCloseDialog ticket={closeRequestedTicket()} />, { role: 'HelpdeskLead' });

    await user.click(screen.getByRole('button', { name: 'Duyệt đóng' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Duyệt đóng' }));

    await waitFor(() => expect(posted).toBe(true));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('M31-FE-S17-H3: refusing with a reason sends POST /refuse-close + the reason', async () => {
    let captured: { reason?: string } | null = null;
    server.use(
      http.post(`${base}/tickets/tk-1/refuse-close`, async ({ request }) => {
        captured = (await request.json()) as { reason?: string };
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReviewCloseDialog ticket={closeRequestedTicket()} />, { role: 'HelpdeskLead' });

    await user.click(screen.getByRole('button', { name: 'Từ chối' }));
    await user.type(screen.getByLabelText('Lý do từ chối'), 'Chưa có ảnh nghiệm thu');
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Từ chối' }));

    await waitFor(() => expect(captured?.reason).toBe('Chưa có ảnh nghiệm thu'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('M31-FE-S17-E2: refusing with no reason shows an inline error and sends no request', async () => {
    let posted = false;
    server.use(
      http.post(`${base}/tickets/tk-1/refuse-close`, () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReviewCloseDialog ticket={closeRequestedTicket()} />, { role: 'HelpdeskLead' });

    await user.click(screen.getByRole('button', { name: 'Từ chối' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Từ chối' }));

    expect(await screen.findByText('Cần lý do từ chối')).toBeInTheDocument();
    expect(posted).toBe(false);
  });
});