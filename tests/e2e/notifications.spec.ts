import { test, expect } from '@playwright/test';
import { setRole } from './helpers';

// S9 — the notification bell is a shadcn DropdownMenu (Radix, no jsdom open).
test('S9: the notification bell opens its panel', async ({ page }) => {
  await page.goto('/');
  await setRole(page, 'HelpdeskAgent'); // seed gives u-hda notifications

  await page.getByRole('button', { name: /Thông báo/ }).click();
  await expect(page.getByRole('link', { name: 'Xem tất cả' })).toBeVisible();
});
