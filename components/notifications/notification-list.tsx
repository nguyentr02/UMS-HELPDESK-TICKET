'use client';

import { useState } from 'react';

import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/lib/queries/notifications';

import { NotificationItem } from './notification-item';

/** On the full page, show this many, with a "Xem thêm" to reveal the rest. */
const INITIAL_VISIBLE = 8;

/** Newest-first notification list. `limit` powers the compact bell panel. */
export function NotificationList({ limit, onNavigate }: { limit?: number; onNavigate?: () => void }) {
  const { data, isLoading, isError } = useNotifications();
  const [expanded, setExpanded] = useState(false);

  const items = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // The bell passes `limit` (hard slice, its own "Xem tất cả" link). The full
  // page has no limit: cap to INITIAL_VISIBLE with a "Xem thêm" toggle.
  const shown = limit ? items.slice(0, limit) : expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hiddenCount = limit ? 0 : items.length - INITIAL_VISIBLE;

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

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 self-start rounded-md px-1 py-0.5 text-sm font-medium text-red-700 outline-none transition-colors hover:text-red-800 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? 'Thu gọn' : `Xem thêm (${hiddenCount} thông báo cũ hơn)`}
        </button>
      ) : null}
    </DataState>
  );
}
