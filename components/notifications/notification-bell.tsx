'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/queries/notifications';
import { Button } from '@/components/ui/button';
import { NotificationList } from './notification-list';

/**
 * Header notification bell — unread badge + a toggle panel (plain state, not a
 * Radix DropdownMenu, so the open/list interaction stays unit-testable in jsdom).
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label="Danh sách thông báo"
            className="absolute right-0 z-50 mt-2 max-h-[70vh] w-80 overflow-auto rounded-lg border border-border bg-card p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Thông báo</span>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-red-700 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <NotificationList limit={6} onNavigate={() => setOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
