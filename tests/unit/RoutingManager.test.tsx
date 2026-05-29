import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/tests/helpers/render';
import { RoutingManager } from '@/components/admin/routing-manager';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

// The category/department pickers are shadcn Selects (Radix) — the add-via-selects flow (S8-E2)
// runs in Playwright (tests/e2e/admin-routing.spec.ts). jsdom covers client validation + access.
describe('RoutingManager (S8)', () => {
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
