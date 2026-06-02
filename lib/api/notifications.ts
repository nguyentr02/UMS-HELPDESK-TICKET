import { apiFetch } from './client';
import type { NotificationItem } from '@/lib/types/domain';

export const listNotifications = () => apiFetch<NotificationItem[]>('/notifications');

export const markNotificationRead = (id: string) =>
  apiFetch<NotificationItem>(`/notifications/${id}/read`, { method: 'POST' });

export const markAllNotificationsRead = () =>
  apiFetch<{ updated: number }>('/notifications/read-all', { method: 'POST' });

export const clearAllNotifications = () =>
  apiFetch<{ deleted: number }>('/notifications', { method: 'DELETE' });
