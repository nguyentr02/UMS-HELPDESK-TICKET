import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/helpers/render';
import { ForwardDialog } from '@/components/helpdesk/forward-dialog';
import type { Category, Ticket } from '@/lib/types/domain';

const catIT: Category = { id: 'cat-it', name: 'IT / Hệ thống số', isActive: true };

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

// Routing rules were removed — there's no auto-preselect anymore. The
// select→confirm→forward (and 409) flow runs in Playwright; here we only
// verify the dialog opens with nothing pre-selected and the confirm gate works.
describe('ForwardDialog', () => {
  it('opens with no preselected department; confirm is disabled until the user picks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForwardDialog ticket={pendingTicket(catIT)} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng ban' }));

    const trigger = await screen.findByRole('combobox', { name: 'Phòng ban' });
    expect(trigger).toHaveTextContent('Chọn phòng ban…');
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Chuyển' }),
    ).toBeDisabled();
  });
});
