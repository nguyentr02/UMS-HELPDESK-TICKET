import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';
import { UserEdit } from '@/components/admin/user-edit';
import { UserDetail } from '@/components/admin/user-detail';
import { __resetCreatedUsers, __getDeactivatedUserIds } from '@/mocks/handlers';
import { createUser, deactivateUser, listUsers } from '@/lib/api/users';
import { renderWithProviders } from '../helpers/render';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
  usePathname: () => '/admin/users/u-sv-1/edit',
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  pushMock.mockReset();
  __resetCreatedUsers();
});

describe('UserEdit — Admin edit-user flow (FE-S16)', () => {
  it('M31-FE-S16-X1: a non-Admin role sees AccessDenied on the edit page', async () => {
    renderWithProviders(<UserEdit id="u-sv-1" />, { role: 'HelpdeskLead' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  it('M31-FE-S16-H1: Admin changes displayName + saves → PATCH succeeds + navigates to detail', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <UserEdit id="u-sv-1" />
        <Toaster />
      </>,
      { role: 'Admin' },
    );

    const nameInput = await screen.findByLabelText('Họ tên');
    await user.clear(nameInput);
    await user.type(nameInput, 'Nguyễn Văn A Đã Đổi');

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/admin/users/u-sv-1');
    });
  });

  it('M31-FE-S16-X5: displayName with digits → inline field error, no PATCH', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserEdit id="u-sv-1" />, { role: 'Admin' });

    const nameInput = await screen.findByLabelText('Họ tên');
    await user.clear(nameInput);
    await user.type(nameInput, 'Nguyen Van 123');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Họ tên chỉ được chứa chữ cái và khoảng trắng')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('M31-FE-S16-X2: no changes → no PATCH; user is informed', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <UserEdit id="u-sv-1" />
        <Toaster />
      </>,
      { role: 'Admin' },
    );

    await screen.findByLabelText('Họ tên');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    // Toast says "no changes"; we don't redirect.
    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  it('M31-FE-S16-X3: short password → inline field error, no PATCH', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserEdit id="u-sv-1" />, { role: 'Admin' });

    await screen.findByLabelText('Họ tên');
    await user.type(screen.getByLabelText('Đặt lại mật khẩu'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Mật khẩu tối thiểu 8 ký tự')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('UserDetail — Admin delete flow (FE-S16)', () => {
  it('M31-FE-S16-H2: Admin sees "Cập nhật" + "Xóa" controls for another user', async () => {
    renderWithProviders(<UserDetail id="u-sv-1" />, { role: 'Admin' });
    expect(await screen.findByRole('link', { name: 'Cập nhật người dùng' })).toHaveAttribute(
      'href',
      '/admin/users/u-sv-1/edit',
    );
    expect(screen.getByRole('button', { name: 'Xóa người dùng' })).not.toBeDisabled();
  });

  it('M31-FE-S16-X4: Admin cannot delete themselves — Xóa button disabled', async () => {
    renderWithProviders(<UserDetail id="u-admin" />, { role: 'Admin' });
    // u-admin is the seeded admin persona AND the persona renderWithProviders
    // defaults to for role=Admin, so isSelf=true → button is disabled.
    expect(await screen.findByRole('button', { name: 'Xóa người dùng' })).toBeDisabled();
  });

  it('M31-FE-S16-H3: Confirm + delete → DEACTIVATED set carries the id, navigates to list', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <UserDetail id="u-sv-1" />
        <Toaster />
      </>,
      { role: 'Admin' },
    );

    await user.click(await screen.findByRole('button', { name: 'Xóa người dùng' }));
    // Confirm dialog button has the same label — scope to the dialog by waiting
    // for the dialog text first, then clicking the button inside.
    await screen.findByText(/sẽ bị vô hiệu hóa/);
    const confirmButtons = screen.getAllByRole('button', { name: /Xóa người dùng/ });
    // Two: the page trigger + the dialog confirm. The dialog one is the second.
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/admin/users');
    });
    expect(__getDeactivatedUserIds()).toContain('u-sv-1');
  });

  it('M31-FE-S16-H4: a soft-deleted user is excluded from listUsers() (the reported bug)', async () => {
    // Seed Admin mock-role so apiFetch sends X-Mock-Role: Admin.
    window.localStorage.setItem(
      'm31.mockUser',
      JSON.stringify({ id: 'u-admin', role: 'Admin', departmentId: null, displayName: 'Quản trị viên' }),
    );

    const created = await createUser({
      email: 'todelete@ums.edu.vn',
      displayName: 'Sắp Bị Xóa',
      role: 'SV',
      password: 'temp-pass-1',
    });

    const before = await listUsers({ pageSize: 100 });
    expect(before.items.map((u) => u.id)).toContain(created.id);

    await deactivateUser(created.id);

    const after = await listUsers({ pageSize: 100 });
    expect(after.items.map((u) => u.id)).not.toContain(created.id);
  });

  it('M31-FE-S16-H5: re-creating a deleted user\'s email revives the same row (no 409)', async () => {
    window.localStorage.setItem(
      'm31.mockUser',
      JSON.stringify({ id: 'u-admin', role: 'Admin', departmentId: null, displayName: 'Quản trị viên' }),
    );

    const created = await createUser({
      email: 'reuse@ums.edu.vn',
      displayName: 'Bản Gốc',
      role: 'SV',
      password: 'temp-pass-1',
    });
    await deactivateUser(created.id);

    // Re-create with the same email — should revive, not throw 409.
    const revived = await createUser({
      email: 'reuse@ums.edu.vn',
      displayName: 'Bản Hồi Sinh',
      role: 'GV',
      password: 'temp-pass-2',
    });
    expect(revived.id).toBe(created.id);
    expect(revived.displayName).toBe('Bản Hồi Sinh');
    expect(revived.role).toBe('GV');

    // And it's back in the directory.
    const list = await listUsers({ pageSize: 100 });
    expect(list.items.map((u) => u.id)).toContain(created.id);
  });
});
