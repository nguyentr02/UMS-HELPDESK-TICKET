import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { UserDetail } from '@/components/admin/user-detail';
import { renderWithProviders } from '../helpers/render';

describe('UserDetail — Admin per-user view (FE-S14)', () => {
  it('M31-FE-S14-X2: a non-Admin role sees AccessDenied', async () => {
    renderWithProviders(<UserDetail id="u-admin" />, { role: 'HelpdeskLead' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  it('M31-FE-S14-H3: Admin sees the requested user record', async () => {
    renderWithProviders(<UserDetail id="u-admin" />, { role: 'Admin' });
    // "Quản trị viên" appears both as the user's displayName AND as the
    // ROLE_VI badge label for Admin — match at least one occurrence.
    const matches = await screen.findAllByText('Quản trị viên');
    expect(matches.length).toBeGreaterThan(0);
    expect(await screen.findByText('admin@ums.edu.vn')).toBeInTheDocument();
  });

  it('M31-FE-S14-X3: missing id → 404 message', async () => {
    renderWithProviders(<UserDetail id="u-does-not-exist" />, { role: 'Admin' });
    expect(await screen.findByText('Không tìm thấy người dùng.')).toBeInTheDocument();
  });
});
