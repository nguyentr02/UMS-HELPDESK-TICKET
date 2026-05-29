import { test, expect } from '@playwright/test';
import { setRole } from './helpers';

// S8-E2 — add a routing rule through the shadcn Selects (Radix, no jsdom open).
test('S8-E2: an Admin adds a routing rule via the Selects', async ({ page }) => {
  await page.goto('/admin/routing');
  await setRole(page, 'Admin');

  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(table.getByText('Khác')).toHaveCount(0); // cat-khac has no seed rule

  await page.getByRole('combobox', { name: 'Danh mục' }).click();
  await page.getByRole('option', { name: 'Khác' }).click();
  await page.getByRole('combobox', { name: 'Phòng ban' }).click();
  await page.getByRole('option', { name: 'CAIRA / Phòng IT' }).click();
  await page.getByRole('button', { name: 'Thêm quy tắc' }).click();

  await expect(table.getByText('Khác')).toBeVisible();
});
