import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';
import { UserCreateForm } from '@/components/admin/user-create-form';
import { UserDirectory } from '@/components/admin/user-directory';
import { __resetCreatedUsers } from '@/mocks/handlers';
import { renderWithProviders } from '../helpers/render';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
  usePathname: () => '/admin/users/new',
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  pushMock.mockReset();
  __resetCreatedUsers();
});

describe('UserCreateForm — Admin create-user flow (FE-S15)', () => {
  it('M31-FE-S15-H1: Admin fills the form and submits → POST succeeds + navigates to detail', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <UserCreateForm />
        <Toaster />
      </>,
      { role: 'Admin' },
    );

    await user.type(screen.getByLabelText('Email'), 'newperson@ums.edu.vn');
    await user.type(screen.getByLabelText('Họ tên'), 'Người Mới');
    // Role defaults to SV — leave it. Skip department + password (both optional).

    await user.click(screen.getByRole('button', { name: 'Tạo người dùng' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.stringMatching(/^\/admin\/users\/u-created-/),
      );
    });
  });

  it('M31-FE-S15-H2: leaving password blank still creates (SSO-only user)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserCreateForm />, { role: 'Admin' });

    await user.type(screen.getByLabelText('Email'), 'ssoonly@ums.edu.vn');
    await user.type(screen.getByLabelText('Họ tên'), 'Chỉ SSO');
    await user.click(screen.getByRole('button', { name: 'Tạo người dùng' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
  });

  it('M31-FE-S15-X1: duplicate email (matches a seeded persona) → inline field error, no navigate', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserCreateForm />, { role: 'Admin' });

    await user.type(screen.getByLabelText('Email'), 'admin@ums.edu.vn'); // seeded
    await user.type(screen.getByLabelText('Họ tên'), 'Trùng email');
    await user.click(screen.getByRole('button', { name: 'Tạo người dùng' }));

    expect(await screen.findByText('Email đã được sử dụng')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('M31-FE-S15-X2: short password → inline field error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserCreateForm />, { role: 'Admin' });

    await user.type(screen.getByLabelText('Email'), 'shortpw@ums.edu.vn');
    await user.type(screen.getByLabelText('Họ tên'), 'Mật khẩu ngắn');
    await user.type(screen.getByLabelText('Mật khẩu'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Tạo người dùng' }));

    expect(await screen.findByText('Mật khẩu tối thiểu 8 ký tự')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('UserDirectory — "Tạo người dùng" trigger visibility (FE-S15)', () => {
  it('M31-FE-S15-H3: Admin sees the "Tạo người dùng" trigger linking to /admin/users/new', async () => {
    renderWithProviders(<UserDirectory />, { role: 'Admin' });
    const trigger = await screen.findByRole('link', { name: 'Tạo người dùng' });
    expect(trigger).toHaveAttribute('href', '/admin/users/new');
  });

  // RBAC for the trigger is already enforced upstream — non-Admin renders
  // AccessDenied for the whole directory page (covered by FE-S14-X1).
});
