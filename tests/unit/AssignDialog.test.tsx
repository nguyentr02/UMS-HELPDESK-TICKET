import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { AssignDialog } from '@/components/helpdesk/assign-dialog';
import { CONFLICT_MESSAGE } from '@/lib/api/errors';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function pendingTicket(): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Wifi chậm',
    description: '',
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
  };
}

const agents = [
  { id: 'u-hda', displayName: 'Helpdesk Agent' },
  { id: 'u-hda2', displayName: 'Phạm Thị Agent' },
];

async function openAndWaitForAgents(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Gán nhân viên' }));
  const select = await screen.findByLabelText('Nhân viên Helpdesk');
  await waitFor(() =>
    expect(within(select).getByRole('option', { name: 'Helpdesk Agent' })).toBeInTheDocument(),
  );
  return select;
}

describe('AssignDialog (S3)', () => {
  it('S3-E1: lists only Helpdesk agents and filters by search', async () => {
    server.use(http.get(`${base}/agents`, () => HttpResponse.json({ data: agents, error: null, requestId: 'r' })));
    const user = userEvent.setup();
    renderWithProviders(<AssignDialog ticket={pendingTicket()} />, { role: 'HelpdeskLead' });
    const select = await openAndWaitForAgents(user);
    expect(within(select).getByRole('option', { name: 'Phạm Thị Agent' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Tìm nhân viên'), 'Phạm');
    await waitFor(() =>
      expect(within(select).queryByRole('option', { name: 'Helpdesk Agent' })).not.toBeInTheDocument(),
    );
    expect(within(select).getByRole('option', { name: 'Phạm Thị Agent' })).toBeInTheDocument();
  });

  it('S3-H1: assigning an agent sends POST /assign and toasts success', async () => {
    server.use(
      http.get(`${base}/agents`, () => HttpResponse.json({ data: agents, error: null, requestId: 'r' })),
      http.post(`${base}/tickets/tk-1/assign`, () =>
        HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<AssignDialog ticket={pendingTicket()} />, { role: 'HelpdeskLead' });
    const select = await openAndWaitForAgents(user);
    await user.selectOptions(select, 'u-hda');
    await user.click(screen.getByRole('button', { name: 'Gán' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('S3-X2: a 409 shows the refresh toast', async () => {
    server.use(
      http.get(`${base}/agents`, () => HttpResponse.json({ data: agents, error: null, requestId: 'r' })),
      http.post(`${base}/tickets/tk-1/assign`, () =>
        HttpResponse.json({ data: null, error: { code: 'conflict', message: 'no' }, requestId: 'r' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<AssignDialog ticket={pendingTicket()} />, { role: 'HelpdeskLead' });
    const select = await openAndWaitForAgents(user);
    await user.selectOptions(select, 'u-hda');
    await user.click(screen.getByRole('button', { name: 'Gán' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(CONFLICT_MESSAGE));
  });
});
