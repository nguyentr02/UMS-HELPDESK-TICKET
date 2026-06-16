import { describe, expect, it } from 'vitest';

import { prependNotification } from '@/lib/realtime/notifications-cache';
import type { NotificationItem } from '@/lib/types/domain';

function notif(over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'n1',
    type: 'TicketAssigned',
    ticketId: 't-1',
    payload: { ticketCode: 'HD-1' },
    readAt: null,
    createdAt: '2026-06-16T00:00:00Z',
    ...over,
  };
}

describe('prependNotification (realtime cache merge)', () => {
  it('prepends a new notification to the front of the list', () => {
    const existing = [notif({ id: 'n0' })];
    const result = prependNotification(existing, notif({ id: 'n1' }));
    expect(result.map((n) => n.id)).toEqual(['n1', 'n0']);
  });

  it('seeds the list when the cache is empty/undefined', () => {
    expect(prependNotification(undefined, notif({ id: 'n1' }))).toHaveLength(1);
    expect(prependNotification([], notif({ id: 'n1' }))[0].id).toBe('n1');
  });

  it('dedupes by id — a re-emitted/already-cached notification is ignored', () => {
    const existing = [notif({ id: 'n1' }), notif({ id: 'n0' })];
    const result = prependNotification(existing, notif({ id: 'n1' }));
    expect(result).toBe(existing); // unchanged reference → no duplicate, no churn
    expect(result.map((n) => n.id)).toEqual(['n1', 'n0']);
  });
});