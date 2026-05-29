'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/queries/notifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationList } from './notification-list';

/** Header notification bell — unread badge + a shadcn DropdownMenu panel of the latest few. */
export function NotificationBell() {
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.readAt).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
          className="relative"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Thông báo</span>
          <Link href="/notifications" className="text-xs text-red-700 hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="max-h-[70vh] overflow-auto p-3">
          <NotificationList limit={6} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
