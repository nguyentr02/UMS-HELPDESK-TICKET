'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building2,
  ClipboardList,
  Headset,
  Inbox,
  LayoutDashboard,
  Plus,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from '@/lib/auth/session';
import { navSectionsFor, ROLE_VI, type NavIcon } from '@/lib/auth/nav';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleSwitcher } from './role-switcher';

const ICONS: Record<NavIcon, LucideIcon> = {
  create: Plus,
  list: ClipboardList,
  dashboard: LayoutDashboard,
  queue: Inbox,
  dept: Building2,
  notifications: Bell,
  categories: Tags,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const picked =
    parts.length >= 2 ? parts[parts.length - 2][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return picked.toUpperCase();
}

/** Sidebar interior — reused by the desktop `<aside>` and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role, isReady } = useSession();
  const pathname = usePathname();
  // While the session is still restoring from localStorage the role is the
  // SSR default (SV), so showing nav items here would flash the wrong sidebar
  // before the real role lands.
  const sections = isReady ? navSectionsFor(role) : [];

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 bg-slate-100/90 px-4 backdrop-blur-sm">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
            <Headset className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-semibold">Helpdesk</span>
            <span className="truncate text-xs text-muted-foreground">
              {isReady ? ROLE_VI[role] : ' '}
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-busy={!isReady}>
        {!isReady ? (
          <div className="flex flex-col gap-2 px-4 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-4 w-20 mt-3" />
            <Skeleton className="h-7 w-full" />
          </div>
        ) : null}
        {sections.map((section) => (
          <div key={section.label} className="mb-2">
            <p className="px-4 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700',
                        active && 'border-red-600 bg-red-50 font-semibold text-red-700',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2">
          {isReady ? (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white"
              aria-hidden
            >
              {initials(user.displayName)}
            </div>
          ) : (
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          )}
          <div className="min-w-0 flex-1">
            {isReady ? (
              <>
                <div className="truncate text-sm font-medium">{user.displayName}</div>
                <div className="truncate text-xs text-muted-foreground">{ROLE_VI[role]}</div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
          </div>
        </div>
        {isReady ? <RoleSwitcher /> : <Skeleton className="h-9 w-full" />}
      </div>
    </div>
  );
}

/** Desktop sidebar — fixed rail at `md:` and up; hidden on mobile (drawer instead). */
export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 md:sticky md:top-0 md:block md:h-screen">
      <SidebarContent />
    </aside>
  );
}
