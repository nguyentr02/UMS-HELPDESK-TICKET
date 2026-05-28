'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markNotificationRead } from '@/lib/api/notifications';

export const notificationKeys = { all: ['notifications'] as const };

export function useNotifications() {
  return useQuery({ queryKey: notificationKeys.all, queryFn: listNotifications });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
