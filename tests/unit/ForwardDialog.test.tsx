import { describe, it, expect } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/helpers/render';
import { ForwardDialog } from '@/components/helpdesk/forward-dialog';
import type { Category, Ticket } from '@/lib/types/domain';

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

// The department picker is a shadcn Combobox — the select→confirm→forward (and 409) flow
// runs in Playwright (tests/e2e/helpdesk-actions.spec.ts). jsdom covers the preselect logic
// (which is visible in the closed trigger) + the disabled-confirm gate.
describe('ForwardDialog (S4)', () => {
  it('S4-H1: pre-selects the category default department (seed cat-it → dep-it)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForwardDialog ticket={pendingTicket(catIT)} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng ban' }));

    const trigger = await screen.findByRole('combobox', { name: 'Phòng ban' });
    await waitFor(() => expect(trigger).toHaveTextContent('CAIRA / Phòng IT'));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chuyển' })).toBeEnabled();
  });

  it('S4-E1: "Khác" has no routing rule → nothing pre-selected (confirm disabled)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForwardDialog ticket={pendingTicket(catKhac)} />, { role: 'HelpdeskAgent' });
    await user.click(screen.getByRole('button', { name: 'Chuyển phòng ban' }));

    const trigger = await screen.findByRole('combobox', { name: 'Phòng ban' });
    expect(trigger).toHaveTextContent('Chọn phòng ban…');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chuyển' })).toBeDisabled();
  });
});
