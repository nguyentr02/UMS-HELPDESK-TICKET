import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { CategoryManager } from '@/components/admin/category-manager';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

describe('CategoryManager (S8)', () => {
  it('S8-H1: adding a category posts it and shows it in the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />, { role: 'Admin' });
    const list = await screen.findByRole('list', { name: 'Danh sách danh mục' });
    expect(within(list).getByText('IT / Hệ thống số')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Tên danh mục'), 'Thiết bị mạng');
    await user.click(screen.getByRole('button', { name: 'Thêm danh mục' }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Danh sách danh mục' })).getByText('Thiết bị mạng'),
      ).toBeInTheDocument(),
    );
  });

  it('S8-X2: a duplicate name is rejected with a field error (422)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />, { role: 'Admin' });
    await screen.findByRole('list', { name: 'Danh sách danh mục' });

    await user.type(screen.getByLabelText('Tên danh mục'), 'IT / Hệ thống số');
    await user.click(screen.getByRole('button', { name: 'Thêm danh mục' }));

    expect(await screen.findByText('Tên danh mục đã tồn tại')).toBeInTheDocument();
  });

  it('X2 (client): a too-short name blocks submit with no API call', async () => {
    const calls: string[] = [];
    server.use(
      http.post(`${base}/categories`, () => {
        calls.push('post');
        return HttpResponse.json({ data: null, error: null, requestId: 'r' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CategoryManager />, { role: 'Admin' });
    await screen.findByRole('list', { name: 'Danh sách danh mục' });

    await user.type(screen.getByLabelText('Tên danh mục'), 'x');
    await user.click(screen.getByRole('button', { name: 'Thêm danh mục' }));

    expect(await screen.findByText('Tên danh mục tối thiểu 2 ký tự')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('S8-X1: a non-Admin is denied the categories console', async () => {
    renderWithProviders(<CategoryManager />, { role: 'HelpdeskLead' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });
});
