import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { ReviewRedirectDialog } from '@/components/helpdesk/review-redirect-dialog';
import { approveRedirect } from '@/lib/api/tickets';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function redirectRequestedTicket(): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Mất điện A1',
    description: '',
    severity: 'High',
    internalStatus: 'RedirectRequested',
    externalStatus: 'Processing',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: { id: 'u-hda', displayName: 'Agent' },
    routedDepartment: { id: 'dep-csvc', code: 'CSVC', name: 'Phòng Quản trị CSVC' },
    attachments: [],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
  };
}

describe('ReviewRedirectDialog (S19)', () => {
  it('M31-FE-S19-H3: refusing with a reason sends POST /refuse-redirect + the reason', async () => {
    const captured: { reason?: string } = {};
    server.use(
      http.post(`${base}/tickets/tk-1/refuse-redirect`, async ({ request }) => {
        Object.assign(captured, (await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReviewRedirectDialog ticket={redirectRequestedTicket()} />, { role: 'HelpdeskLead' });

    await user.click(screen.getByRole('button', { name: 'Từ chối' }));
    await user.type(screen.getByLabelText('Lý do từ chối chuyển'), 'Đúng phòng bạn');
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Từ chối' }));

    await waitFor(() => expect(captured.reason).toBe('Đúng phòng bạn'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('M31-FE-S19-E2: refusing with no reason shows an inline error, no request', async () => {
    let posted = false;
    server.use(
      http.post(`${base}/tickets/tk-1/refuse-redirect`, () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReviewRedirectDialog ticket={redirectRequestedTicket()} />, { role: 'HelpdeskLead' });

    await user.click(screen.getByRole('button', { name: 'Từ chối' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Từ chối' }));

    expect(await screen.findByText('Cần lý do từ chối')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('M31-FE-S19-G5: the Approve dialog opens with the confirm disabled until a dept is picked', async () => {
    // The dept Combobox isn't reliably drivable in jsdom; the select→approve
    // happy path lives in Playwright. Here we assert the gating.
    const user = userEvent.setup();
    renderWithProviders(<ReviewRedirectDialog ticket={redirectRequestedTicket()} />, { role: 'HelpdeskLead' });
    await user.click(screen.getByRole('button', { name: 'Duyệt chuyển' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Duyệt chuyển' })).toBeDisabled();
  });

  it('M31-FE-S19-H2: approveRedirect API carries departmentId + note', async () => {
    const captured: { departmentId?: string; note?: string } = {};
    server.use(
      http.post(`${base}/tickets/tk-1/approve-redirect`, async ({ request }) => {
        Object.assign(captured, (await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    await approveRedirect('tk-1', 'dep-hcns', 'Đúng HCNS');
    expect(captured.departmentId).toBe('dep-hcns');
    expect(captured.note).toBe('Đúng HCNS');
  });
});