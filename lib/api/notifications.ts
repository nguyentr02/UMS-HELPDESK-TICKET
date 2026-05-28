import { apiFetch } from './client';
import type { NotificationItem } from '@/lib/types/domain';

export const listNotifications = () => apiFetch<NotificationItem[]>('/notifications');

export const markNotificationRead = (id: string) =>
  apiFetch<NotificationItem>(`/notifications/${id}/read`, { method: 'POST' });
