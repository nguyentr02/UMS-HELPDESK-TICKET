import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RoutingManager } from '@/components/admin/routing-manager';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError }, Toaster: () => null }));

describe('RoutingManager (S8)', () => {
  it('S8-E2: adding a rule posts it and shows it in the table', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoutingManager />, { role: 'Admin' });
    await screen.findByRole('table');
    // "Khác" (cat-khac) has no seed rule → not in the table yet.
    expect(within(screen.getByRole('table')).queryByText('Khác')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Danh mục'), 'cat-khac');
    await user.selectOptions(screen.getByLabelText('Phòng ban'), 'dep-it');
    await user.click(screen.getByRole('button', { name: 'Thêm quy tắc' }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getByText('Khác')).toBeInTheDocument(),
    );
  });

  it('blocks submit (no API call) when category/department are not chosen', async () => {
    const calls: string[] = [];
    server.use(
      http.post(`${base}/routing-rules`, () => {
        calls.push('post');
        return HttpResponse.json({ data: null, error: null, requestId: 'r' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<RoutingManager />, { role: 'Admin' });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Thêm quy tắc' }));
    expect(await screen.findByText('Vui lòng chọn danh mục và phòng ban.')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('S8-X1: a non-Admin is denied the routing console', async () => {
    renderWithProviders(<RoutingManager />, { role: 'HelpdeskAgent' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });
});
