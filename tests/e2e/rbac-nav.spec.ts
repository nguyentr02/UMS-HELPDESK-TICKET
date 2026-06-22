import { expect,test } from '@playwright/test';

import { setRole } from './helpers';

// S2-I1 — log in as each role group (via the mock role switcher) and assert the
// visible sidebar nav matches the RBAC grid (role-permission-matrix.md §4).

test.describe('S2-I1: role-scoped navigation', () => {
  test('SV (requester) sees only the requester section', async ({ page }) => {
    await page.goto('/');
    await setRole(page, 'SV');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Tạo yêu cầu' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Yêu cầu của tôi' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Hàng đợi', exact: true })).toHaveCount(0);
  });

  test('Helpdesk Lead sees the queue + dashboard, not the admin config', async ({ page }) => {
    await page.goto('/');
    await setRole(page, 'HelpdeskLead');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Hàng đợi', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Báo cáo' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Danh mục' })).toHaveCount(0);
  });

  test('Admin sees catalog + all tickets, not create or routing', async ({ page }) => {
    await page.goto('/');
    await setRole(page, 'Admin');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Tất cả yêu cầu' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Danh mục' })).toBeVisible();
    // Routing rules were removed.
    await expect(nav.getByRole('link', { name: 'Định tuyến' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Tạo yêu cầu' })).toHaveCount(0);
  });
});
