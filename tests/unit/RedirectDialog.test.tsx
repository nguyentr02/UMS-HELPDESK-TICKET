import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RedirectDialog } from '@/components/helpdesk/redirect-dialog';
import { redirectTicket } from '@/lib/api/tickets';
import { ApiError } from '@/lib/api/client';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

function assignedTicket(): Ticket {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Mất điện A1',
    description: '',
    severity: 'High',
    internalStatus: 'Assigned',
    externalStatus: 'Requested',
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

// The dept Combobox (Radix Popover + cmdk) isn't reliably drivable in jsdom —
// the select→submit happy path lives in Playwright (mirrors ForwardDialog).
// Here we cover the dialog gating + the API payload directly.
describe('RedirectDialog (S18) — dialog gating', () => {
  it('M31-FE-S18-G1: opens with no dept preselected and the confirm disabled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RedirectDialog ticket={assignedTicket()} />, { role: 'HelpdeskLead' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng khác' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Lý do chuyển phòng ban')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Chuyển' })).toBeDisabled();
  });
});

describe('redirectTicket API (S18)', () => {
  it('M31-FE-S18-H1: POST /redirect carries departmentId + reason', async () => {
    const captured: { departmentId?: string; reason?: string } = {};
    server.use(
      http.post(`${base}/tickets/tk-1/redirect`, async ({ request }) => {
        Object.assign(captured, (await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ data: { id: 'tk-1' }, error: null, requestId: 'r' });
      }),
    );
    await redirectTicket('tk-1', 'dep-hcns', 'Thuộc HCNS');
    expect(captured.departmentId).toBe('dep-hcns');
    expect(captured.reason).toBe('Thuộc HCNS');
  });

  it('M31-FE-S18-E1: a 422 (same dept) surfaces as ApiError with the field', async () => {
    server.use(
      http.post(`${base}/tickets/tk-1/redirect`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'validation_error', message: 'x', fields: { departmentId: 'Ticket đã thuộc phòng ban này' } }, requestId: 'r' },
          { status: 422 },
        ),
      ),
    );
    await expect(redirectTicket('tk-1', 'dep-csvc', 'x')).rejects.toBeInstanceOf(ApiError);
  });
});