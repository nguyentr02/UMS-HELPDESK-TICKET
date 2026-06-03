'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearAllNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';

export const notificationKeys = { all: ['notifications'] as const };

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

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
