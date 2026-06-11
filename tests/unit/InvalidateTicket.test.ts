import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { invalidateTicket } from '@/lib/queries/helpdesk';
import { analyticsKeys } from '@/lib/queries/analytics';
import { ticketKeys } from '@/lib/queries/tickets';

describe('invalidateTicket — refreshes the dashboard too (S17 follow-up)', () => {
  it('M31-FE-S17-A1: invalidates the ticket, history, list, AND analytics summary', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    invalidateTicket(qc, 'tk-1');

    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(ticketKeys.detail('tk-1')));
    expect(keys).toContain(JSON.stringify(ticketKeys.all));
    // The fix: a transition must also refresh the analytics dashboard counts.
    expect(keys).toContain(JSON.stringify(analyticsKeys.summary));
  });
});