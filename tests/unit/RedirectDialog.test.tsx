import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RedirectDialog } from '@/components/helpdesk/redirect-dialog';
import type { Ticket } from '@/lib/types/domain';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

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

// The department picker is a shadcn Combobox — the select→reason→redirect (and 409) flow runs
// in Playwright (tests/e2e/helpdesk-actions.spec.ts). jsdom covers the reason validation, which
// needs no dropdown (the Zod check runs on confirm).
describe('RedirectDialog (S5)', () => {
  it('S5 (visibility): opens with the department picker and reason field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RedirectDialog ticket={assignedTicket()} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển hướng' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Phòng ban mới')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Lý do')).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Chuyển hướng' }));
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText('Lý do'), 'ab');
    await user.click(within(dialog).getByRole('button', { name: 'Chuyển hướng' }));

    expect(await screen.findByText('Lý do tối thiểu 3 ký tự')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });
});
