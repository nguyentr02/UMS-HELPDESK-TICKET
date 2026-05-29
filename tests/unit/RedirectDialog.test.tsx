import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RedirectDialog } from '@/components/helpdesk/redirect-dialog';
import { CONFLICT_MESSAGE } from '@/lib/api/errors';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function assignedTicket(): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Sai phòng ban',
    description: '',
    severity: 'Medium',
    internalStatus: 'Assigned',
    externalStatus: 'Requested',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' },
    routedDepartment: { id: 'dep-it', code: 'IT', name: 'CAIRA / Phòng IT' },
    attachments: [],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
  };
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Chuyển hướng' }));
  await screen.findByLabelText('Phòng ban mới');
}

describe('RedirectDialog (S5)', () => {
  it('S5-H1: redirecting with a dept + reason sends POST /redirect', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/redirect`, () =>
        HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RedirectDialog ticket={assignedTicket()} />, { role: 'HelpdeskAgent' });
    await openDialog(user);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Phòng Kế toán' })).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText('Phòng ban mới'), 'dep-kt');
    await user.type(screen.getByLabelText('Lý do'), 'Thuộc phạm vi phòng Kế toán');
    await user.click(screen.getByRole('button', { name: 'Chuyển hướng' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('S5-X1: a too-short reason blocks submit with a validation message', async () => {
    const postSpy = vi.fn();
    server.use(
      http.post(`${base}/tickets/tk-1/redirect`, () => {
        postSpy();
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<RedirectDialog ticket={assignedTicket()} />, { role: 'HelpdeskAgent' });
    await openDialog(user);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Phòng Kế toán' })).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText('Phòng ban mới'), 'dep-kt');
    await user.type(screen.getByLabelText('Lý do'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Chuyển hướng' }));
    expect(await screen.findByText('Lý do tối thiểu 3 ký tự')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('S5-X2: a 409 shows the refresh toast', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/redirect`, () =>
        HttpResponse.json({ data: null, error: { code: 'conflict', message: 'no' }, requestId: 'r' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RedirectDialog ticket={assignedTicket()} />, { role: 'HelpdeskAgent' });
    await openDialog(user);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Phòng Kế toán' })).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText('Phòng ban mới'), 'dep-kt');
    await user.type(screen.getByLabelText('Lý do'), 'Sai phòng ban');
    await user.click(screen.getByRole('button', { name: 'Chuyển hướng' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(CONFLICT_MESSAGE));
  });
});
