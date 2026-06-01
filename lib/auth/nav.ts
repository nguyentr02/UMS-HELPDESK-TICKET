import type { Role } from '@/lib/types/domain';
import {
  canManageCategories,
  canManageRouting,
  canViewDashboard,
  canViewQueue,
  isRequester,
  receivesDailyReminder,
} from './rbac';

export type NavIcon =
  | 'create'
  | 'list'
  | 'dashboard'
  | 'queue'
  | 'dept'
  | 'notifications'
  | 'categories'
  | 'routing';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Where a ticket opens for the current role — a notification/link target.
 * Requester → their read-only detail; DeptStaff → the dept detail; Helpdesk &
 * Admin → the console detail.
 */
export function ticketDetailHref(role: Role, ticketId: string): string {
  if (role === 'DeptStaff') return `/staff/tickets/${ticketId}`;
  if (role === 'HelpdeskAgent' || role === 'HelpdeskLead' || role === 'Admin') {
    return `/helpdesk/tickets/${ticketId}`;
  }
  return `/tickets/${ticketId}`;
}

/** Vietnamese role labels for the sidebar badge + user footer. */
export const ROLE_VI: Record<Role, string> = {
  SV: 'Sinh viên',
  GV: 'Giảng viên',
  NV: 'Nhân viên',
  HelpdeskAgent: 'Helpdesk Agent',
  HelpdeskLead: 'Helpdesk Lead',
  DeptStaff: 'Nhân viên phòng ban',
  Admin: 'Quản trị viên',
};

/**
 * Grouped, role-driven sidebar (UI design: docs/ui-design/helpdesk-console.html),
 * gated by `docs/role-permission-matrix.md`. DeptStaff *can* create/view-own
 * (capability) but those are URL/CTA-reachable, not a primary sidebar entry —
 * so the requester section is gated on `isRequester`, not `canCreate`.
 */
export function navSectionsFor(role: Role): NavSection[] {
  const sections: NavSection[] = [];

  if (isRequester(role)) {
    sections.push({
      label: 'Yêu cầu của tôi',
      items: [
        { href: '/tickets/new', label: 'Tạo yêu cầu', icon: 'create' },
        { href: '/tickets', label: 'Yêu cầu của tôi', icon: 'list' },
      ],
    });
  }

  const helpdesk: NavItem[] = [];
  if (canViewDashboard(role)) helpdesk.push({ href: '/analytics', label: 'Báo cáo', icon: 'dashboard' });
  if (canViewQueue(role)) {
    helpdesk.push({
      href: '/helpdesk/queue',
      label: role === 'Admin' ? 'Tất cả yêu cầu' : 'Hàng đợi',
      icon: 'queue',
    });
  }
  if (receivesDailyReminder(role) && role !== 'DeptStaff') {
    helpdesk.push({ href: '/notifications', label: 'Thông báo', icon: 'notifications' });
  }
  if (helpdesk.length) sections.push({ label: 'Helpdesk', items: helpdesk });

  if (role === 'DeptStaff') {
    sections.push({
      label: 'Phòng ban',
      items: [
        { href: '/staff/queue', label: 'Hàng đợi phòng ban', icon: 'dept' },
        { href: '/notifications', label: 'Thông báo', icon: 'notifications' },
      ],
    });
  }

  const config: NavItem[] = [];
  if (canManageCategories(role)) config.push({ href: '/admin/categories', label: 'Danh mục', icon: 'categories' });
  if (canManageRouting(role)) config.push({ href: '/admin/routing', label: 'Định tuyến', icon: 'routing' });
  if (config.length) sections.push({ label: 'Cấu hình', items: config });

  return sections;
}

/**
 * Default landing route for a role — the first item of its first sidebar
 * section. Used by the role switcher so changing role both updates the
 * session AND moves the user onto a surface their role can actually use.
 */
export function homeRouteFor(role: Role): string {
  const sections = navSectionsFor(role);
  return sections[0]?.items[0]?.href ?? '/';
}
