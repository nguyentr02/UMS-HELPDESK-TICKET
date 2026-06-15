'use client';

import { Menu } from 'lucide-react';
import { type ReactNode,useState } from 'react';

import { LogoutButton } from '@/components/auth/logout-button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSessionOptional } from '@/lib/auth/session';

import { Sidebar, SidebarContent } from './sidebar';

/**
 * App frame — responsive (memory: ship mobile + desktop):
 * - `md:` and up: a fixed sidebar rail.
 * - below `md:`: the sidebar collapses into a hamburger → left drawer (Sheet).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ctx = useSessionOptional();
  const hasUser = !!ctx?.user;

  return (
    <div className="flex min-h-[calc(100vh-1.5rem)]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — hamburger is mobile-only; the notification bell + logout show whenever a session is present. */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-slate-100/90 px-3 text-slate-800 shadow-sm backdrop-blur-sm">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 md:hidden"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Điều hướng</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-medium text-slate-900 md:hidden">M31 Helpdesk</span>
          <div className="ml-auto flex items-center gap-1">
            {hasUser ? <NotificationBell /> : null}
            {hasUser ? <LogoutButton /> : null}
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
