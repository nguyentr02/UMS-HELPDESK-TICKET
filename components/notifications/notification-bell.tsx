'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadCount } from '@/lib/queries/notifications';

import { NotificationList } from './notification-list';

/**
 * Header notification bell — unread badge + a shadcn DropdownMenu panel of the
 * latest few. Freshness is handled upstream: `SocketProvider` pushes
 * `notification:new` in realtime (badge bumps instantly), with the 30s
 * `useNotifications` poll as fallback — so the bell just renders state.
 */
export function NotificationBell() {
  const unread = useUnreadCount();

  // Controlled `open` so the dropdown can close itself when the user clicks a
  // notification — the inner `<Link>`s aren't wrapped in DropdownMenuItem
  // (Radix's focus-trap was eating their clicks), so they bypass Radix's
  // built-in "close on item click". We compensate via an explicit close callback.
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
          className="relative text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-100 bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={8} className="w-[calc(100vw-2rem)] sm:w-80 p-0 pb-3">
        <div className="max-h-[70vh] overflow-auto px-3 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xl font-semibold">Thông báo</span>
            {/* Wrap in DropdownMenuItem so Radix routes the click correctly — a
                bare <Link> inside DropdownMenuContent has its click intercepted
                by the menu's focus-trap and never reaches Next's router. */}
            <DropdownMenuItem asChild className="m-0 p-0">
              <Link
                href="/notifications"
                className="rounded-md px-2.5 py-1 text-xs font-medium text-red-700 outline-none transition-colors hover:bg-red-50 hover:text-red-800 focus:bg-red-50 focus:text-red-800"
              >
                Xem tất cả
              </Link>
            </DropdownMenuItem>
          </div>
          <NotificationList limit={6} onNavigate={() => setOpen(false)} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}