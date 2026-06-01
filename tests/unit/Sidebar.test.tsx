import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderWithProviders } from '@/tests/helpers/render';
import { Sidebar } from '@/components/layout/sidebar';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  // RoleSwitcher (rendered inside the sidebar) now uses useRouter to navigate
  // on role change — provide a no-op stub for the sidebar tests.
  useRouter: () => ({ push: () => {} }),
}));

describe('Sidebar (S2 — role-scoped nav, per role-permission-matrix.md)', () => {
  it('S2-H1: SV sees only the requester section', () => {
    renderWithProviders(<Sidebar />, { role: 'SV' });
    expect(screen.getByRole('link', { name: 'Tạo yêu cầu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Yêu cầu của tôi' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Báo cáo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Hàng đợi' })).not.toBeInTheDocument();
  });

  it('S2-E1: HelpdeskAgent sees the queue but NOT the dashboard', () => {
    renderWithProviders(<Sidebar />, { role: 'HelpdeskAgent' });
    expect(screen.getByRole('link', { name: 'Hàng đợi' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Báo cáo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Danh mục' })).not.toBeInTheDocument();
    // create/view-own are NOT a sidebar entry for helpdesk roles (matrix wins)
    expect(screen.queryByRole('link', { name: 'Tạo yêu cầu' })).not.toBeInTheDocument();
  });

  it('S2-E2: HelpdeskLead sees dashboard + queue', () => {
    renderWithProviders(<Sidebar />, { role: 'HelpdeskLead' });
    expect(screen.getByRole('link', { name: 'Báo cáo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hàng đợi' })).toBeInTheDocument();
  });

  it('S2-E3: Admin sees all-tickets + catalog + dashboard, not create', () => {
    renderWithProviders(<Sidebar />, { role: 'Admin' });
    expect(screen.getByRole('link', { name: 'Tất cả yêu cầu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Danh mục' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Định tuyến' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tạo yêu cầu' })).not.toBeInTheDocument();
  });

  it('S2-E4: DeptStaff sees the dept queue, not the create sidebar entry', () => {
    renderWithProviders(<Sidebar />, { role: 'DeptStaff' });
    expect(screen.getByRole('link', { name: 'Hàng đợi phòng ban' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tạo yêu cầu' })).not.toBeInTheDocument();
  });
});
