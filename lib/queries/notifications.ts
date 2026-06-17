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

export function useNotifications() {
  // Notifications need to feel near-real-time. The header bell stays mounted
  // for the whole session, so `refetchOnMount` alone would only fire once at
  // app boot and the badge would drift. Pair a short stale window with a
  // 30 s background poll: every subscriber (bell + dropdown + /notifications
  // page) sees the same fresh count, even if the user never reloads or
  // navigates.
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: listNotifications,
    staleTime: 15_000,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });
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
