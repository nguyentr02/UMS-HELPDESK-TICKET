'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building2,
  ClipboardList,
  GitBranch,
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
import { RoleSwitcher } from './role-switcher';

const ICONS: Record<NavIcon, LucideIcon> = {
  create: Plus,
  list: ClipboardList,
  dashboard: LayoutDashboard,
  queue: Inbox,
  dept: Building2,
  notifications: Bell,
  categories: Tags,
  routing: GitBranch,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const picked =
    parts.length >= 2 ? parts[parts.length - 2][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return picked.toUpperCase();
}

/** Sidebar interior — reused by the desktop `<aside>` and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role } = useSession();
  const pathname = usePathname();
  const sections = navSectionsFor(role);

  return (
    <div className="flex h-full flex-col border-r border-red-100 bg-red-50">
      <div className="flex h-16 items-center border-b border-red-100 px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
            <Headset className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-semibold">Helpdesk</span>
            <span className="truncate text-xs text-muted-foreground">{ROLE_VI[role]}</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul>
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
                        'flex items-center gap-2.5 border-l-2 border-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-100/70 hover:text-red-900',
                        active && 'border-red-600 bg-red-100 font-medium text-red-700',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-red-100 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white"
            aria-hidden
          >
            {initials(user.displayName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.displayName}</div>
            <div className="truncate text-xs text-muted-foreground">{ROLE_VI[role]}</div>
          </div>
        </div>
        <RoleSwitcher />
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
