'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth/session';
import { notificationKeys, useNotifications } from '@/lib/queries/notifications';

import { NotificationList } from './notification-list';

const BADGE_SPINNER_MS = 1000;

/** Header notification bell — unread badge + a shadcn DropdownMenu panel of the latest few. */
export function NotificationBell() {
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.readAt).length;

  // The bell stays mounted for the whole session, so `refetchOnMount` alone
  // never fires on a route change OR an identity switch (the switcher calls
  // queryClient.clear() but that doesn't actively trigger a refetch — it just
  // empties the cache). Watch both signals: invalidate the cache and show a
  // spinner where the badge sits for ~1 s so the user never sees a stale
  // number flicker between the old identity and the new one.
  const qc = useQueryClient();
  const pathname = usePathname();
  const { user } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  // Skip the very first invocation — initial data is already covered by
  // `refetchOnMount: 'always'` on useNotifications. The spinner is meant to
  // mask the in-flight gap *between* states the user just caused, not the
  // first-paint fetch.
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    qc.invalidateQueries({ queryKey: notificationKeys.all });
    setRefreshing(true);
    const t = setTimeout(() => setRefreshing(false), BADGE_SPINNER_MS);
    return () => clearTimeout(t);
  }, [pathname, user.id, qc]);

  // Controlled `open` so the dropdown can close itself when the user clicks
  // a notification — the inner `<Link>`s aren't wrapped in DropdownMenuItem
  // (Radix's own focus-trap was eating their clicks), so they bypass Radix's
  // built-in "close on item click" behaviour. We compensate by passing an
  // explicit close callback through NotificationList → NotificationItem.
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            refreshing
              ? 'Đang tải thông báo'
              : unread > 0
                ? `Thông báo (${unread} chưa đọc)`
                : 'Thông báo'
          }
          className="relative text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {refreshing ? (
            <Loader2
              className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-spin text-slate-900"
              aria-hidden
            />
          ) : unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-100 bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 pb-3">
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
