import { describe, it, expect } from 'vitest';
import { getTicket, listTickets } from '@/lib/api/tickets';

// Drives the real MSW seed handlers (no per-test override) to verify server-derived scoping.
function actAs(id: string, role: string, departmentId: string | null = null) {
  window.localStorage.setItem('m31.mockUser', JSON.stringify({ id, role, departmentId }));
}

describe('GET /tickets scoping (mock backend)', () => {
  it('a Helpdesk Agent sees only tickets assigned to them', async () => {
    actAs('u-hda', 'HelpdeskAgent', 'dep-helpdesk');
    const res = await listTickets({ status: 'open' });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((t) => t.helpdeskAssignee?.id === 'u-hda')).toBe(true);
  });

  it('a Helpdesk Lead sees tickets assigned to other agents too', async () => {
    actAs('u-hdl', 'HelpdeskLead', 'dep-helpdesk');
    const res = await listTickets({ status: 'open' });
    expect(res.items.some((t) => t.helpdeskAssignee && t.helpdeskAssignee.id !== 'u-hda')).toBe(true);
  });

  it('a Dept Staff sees only tickets routed to their department', async () => {
    actAs('u-staff', 'DeptStaff', 'dep-csvc');
    const res = await listTickets({ status: 'open' });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((t) => t.routedDepartment?.id === 'dep-csvc')).toBe(true);
  });

  it("an Agent cannot open a ticket assigned to another agent (403)", async () => {
    actAs('u-hdl', 'HelpdeskLead', 'dep-helpdesk');
    const all = await listTickets({ status: 'open' });
    const otherAgentTicket = all.items.find((t) => t.helpdeskAssignee?.id === 'u-hda2');
    expect(otherAgentTicket).toBeDefined();

    actAs('u-hda', 'HelpdeskAgent', 'dep-helpdesk');
    await expect(getTicket(otherAgentTicket!.id)).rejects.toMatchObject({ status: 403 });
  });
});
