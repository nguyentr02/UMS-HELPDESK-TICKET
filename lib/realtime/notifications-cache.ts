import type { NotificationItem } from '@/lib/types/domain';

/**
 * Prepend a pushed notification to the cached list, deduped by id (a reconnect
 * `invalidate` refetch or a double-emit could otherwise insert a duplicate).
 * Pure so it can be unit-tested without a socket. New items go on top —
 * `useNotifications` sorts unread-first anyway, but ordering here keeps the
 * optimistic insert visually correct until the next refetch reconciles.
 */
export function prependNotification(
  list: NotificationItem[] | undefined,
  n: NotificationItem,
): NotificationItem[] {
  const current = list ?? [];
  if (current.some((x) => x.id === n.id)) return current;
  return [n, ...current];
}