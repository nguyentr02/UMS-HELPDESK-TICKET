'use client';

import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/lib/queries/notifications';

import { NotificationItem } from './notification-item';

/** Newest-first notification list. `limit` powers the compact bell panel. */
export function NotificationList({ limit, onNavigate }: { limit?: number; onNavigate?: () => void }) {
  const { data, isLoading, isError } = useNotifications();
  const items = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      isEmpty={items.length === 0}
      error="Không tải được thông báo. Vui lòng thử lại."
      empty={<EmptyState title="Không có thông báo" description="Bạn chưa có thông báo nào." />}
    >
      <ul className="flex flex-col gap-2">
        {shown.map((n) => (
          <li key={n.id}>
            <NotificationItem item={n} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </DataState>
  );
}
