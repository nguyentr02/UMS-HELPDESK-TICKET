'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clearAllNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import type { NotificationItem } from '@/lib/types/domain';

export const notificationKeys = { all: ['notifications'] as const };

/** Snapshot the list for optimistic rollback. */
type Ctx = { prev?: NotificationItem[] };

// Shared base options so `useNotifications` and `useUnreadCount` subscribe to
// the SAME cache entry — they differ only in `select`. Notifications are
// **socket-driven** (no background poll): `notification:new` pushes live, the
// socket reconnect-invalidate catches up on anything missed while disconnected,
// optimistic mutations cover the user's own read/clear, and the mount fetch
// (gated by `staleTime`) loads history. Trade-off: if the socket is fully down
// (e.g. Render asleep), new items only surface on the next reconnect or mount —
// so keep the realtime server warm.
const NOTIFICATIONS_QUERY = {
  queryKey: notificationKeys.all,
  queryFn: listNotifications,
  staleTime: 30_000,
} as const;

export function useNotifications() {
  return useQuery(NOTIFICATIONS_QUERY);
}

/**
 * Just the unread count, via `select`. The bell re-renders only when the
 * *number* changes — not on every list mutation (mark-read of an already-read
 * item, reordering, etc.) — because select output is compared structurally.
 */
export function useUnreadCount(): number {
  const { data } = useQuery({
    ...NOTIFICATIONS_QUERY,
    select: (items: NotificationItem[]) => items.filter((n) => !n.readAt).length,
  });
  return data ?? 0;
}

/**
 * Optimistic mutations: apply the change to the cache immediately (instant
 * badge/list update), roll back on error, and `onSettled`-invalidate to
 * reconcile with server truth. `cancelQueries` first so an in-flight refetch
 * (or the 30s poll) can't clobber the optimistic write mid-mutation.
 */

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof markNotificationRead>>, unknown, string, Ctx>({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const prev = qc.getQueryData<NotificationItem[]>(notificationKeys.all);
      const now = new Date().toISOString();
      qc.setQueryData<NotificationItem[]>(notificationKeys.all, (old) =>
        (old ?? []).map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof markAllNotificationsRead>>, unknown, void, Ctx>({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const prev = qc.getQueryData<NotificationItem[]>(notificationKeys.all);
      const now = new Date().toISOString();
      qc.setQueryData<NotificationItem[]>(notificationKeys.all, (old) =>
        (old ?? []).map((n) => (n.readAt ? n : { ...n, readAt: now })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof clearAllNotifications>>, unknown, void, Ctx>({
    mutationFn: () => clearAllNotifications(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const prev = qc.getQueryData<NotificationItem[]>(notificationKeys.all);
      qc.setQueryData<NotificationItem[]>(notificationKeys.all, []);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
