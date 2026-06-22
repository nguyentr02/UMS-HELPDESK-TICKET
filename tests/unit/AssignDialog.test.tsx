import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect,it } from 'vitest';

import { AssignDialog } from '@/components/helpdesk/assign-dialog';
import type { Ticket } from '@/lib/types/domain';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const agents = [
  { id: 'u-hda', displayName: 'Đỗ Thị Mai' },
  { id: 'u-hda2', displayName: 'Bùi Thị Lan' },
];

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

// The agent picker is a shadcn Combobox (Radix Popover + cmdk) — its open→filter→pick→assign
// flow runs in Playwright (tests/e2e/helpdesk-actions.spec.ts). jsdom covers visibility/gating.
describe('AssignDialog (S3)', () => {
  it('S3 (visibility): a Lead opens the dialog; the picker shows and confirm is disabled until a pick', async () => {
    server.use(http.get(`${base}/agents`, () => HttpResponse.json({ data: agents, error: null, requestId: 'r' })));
    const user = userEvent.setup();
    renderWithProviders(<AssignDialog ticket={pendingTicket()} />, { role: 'HelpdeskLead' });

    await user.click(screen.getByRole('button', { name: 'Gán nhân viên' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Nhân viên Helpdesk')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Gán' })).toBeDisabled();
  });
});
