import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { CloseDialog } from '@/components/helpdesk/close-dialog';
import { CONFLICT_MESSAGE } from '@/lib/api/errors';
import type { Ticket } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

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

describe('CloseDialog (S7)', () => {
  it('S7-H1: closing sends POST /close and toasts success', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/close`, () =>
        HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CloseDialog ticket={inProgressTicket()} />, { role: 'HelpdeskLead' });
    await user.click(screen.getByRole('button', { name: 'Đóng yêu cầu' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Đóng yêu cầu' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('S7-E2: a resolution note is sent in the close request', async () => {
    let captured: { note?: string } | null = null;
    server.use(
      http.post(`${base}/tickets/tk-1/close`, async ({ request }) => {
        captured = (await request.json()) as { note?: string };
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CloseDialog ticket={inProgressTicket()} />, { role: 'HelpdeskLead' });
    await user.click(screen.getByRole('button', { name: 'Đóng yêu cầu' }));
    await user.type(screen.getByLabelText('Ghi chú xử lý (tuỳ chọn)'), 'Đã thay cầu dao.');
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Đóng yêu cầu' }));
    await waitFor(() => expect(captured?.note).toBe('Đã thay cầu dao.'));
  });

  it('S7-X2: a 409 shows the refresh toast', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/close`, () =>
        HttpResponse.json({ data: null, error: { code: 'conflict', message: 'no' }, requestId: 'r' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CloseDialog ticket={inProgressTicket()} />, { role: 'HelpdeskLead' });
    await user.click(screen.getByRole('button', { name: 'Đóng yêu cầu' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Đóng yêu cầu' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(CONFLICT_MESSAGE));
  });
});
