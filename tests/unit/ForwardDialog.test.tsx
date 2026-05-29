import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { ForwardDialog } from '@/components/helpdesk/forward-dialog';
import { CONFLICT_MESSAGE } from '@/lib/api/errors';
import type { Category, Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

const catIT: Category = { id: 'cat-it', name: 'IT / Hệ thống số', parentId: null, isActive: true };
const catKhac: Category = { id: 'cat-khac', name: 'Khác', parentId: null, isActive: true };

function pendingTicket(category: Category | null): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Wifi chậm',
    description: '',
    severity: 'High',
    internalStatus: 'Pending',
    externalStatus: 'Requested',
    category,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: null,
    routedDepartment: null,
    attachments: [],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
  };
}

describe('ForwardDialog (S4)', () => {
  it('S4-H1: pre-selects the category default dept and forwards', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/forward`, () =>
        HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForwardDialog ticket={pendingTicket(catIT)} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng ban' }));
    // seed routing rule cat-it → dep-it (isDefault) pre-selects the department
    await waitFor(() => expect(screen.getByLabelText('Phòng ban')).toHaveValue('dep-it'));
    await user.click(screen.getByRole('button', { name: 'Chuyển' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('S4-E1: "Khác" has no routing rule → nothing pre-selected (confirm disabled)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForwardDialog ticket={pendingTicket(catKhac)} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng ban' }));
    expect(await screen.findByLabelText('Phòng ban')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Chuyển' })).toBeDisabled();
  });

  it('S4-X2: a 409 shows the refresh toast', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/forward`, () =>
        HttpResponse.json({ data: null, error: { code: 'conflict', message: 'no' }, requestId: 'r' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ForwardDialog ticket={pendingTicket(catIT)} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng ban' }));
    await waitFor(() => expect(screen.getByLabelText('Phòng ban')).toHaveValue('dep-it'));
    await user.click(screen.getByRole('button', { name: 'Chuyển' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(CONFLICT_MESSAGE));
  });
});
