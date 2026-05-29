import { test, expect } from '@playwright/test';
import { setRole } from './helpers';

// S1-I1 — a requester creates a ticket with a severity and lands on "My tickets"
// with the new ticket shown as Đã tiếp nhận (served by the MSW browser worker).

test('S1-I1: a requester creates a ticket and sees it as Đã tiếp nhận', async ({ page }) => {
  await page.goto('/tickets/new');
  await setRole(page, 'SV');

  const title = `E2E không vào được mạng ${Date.now()}`;
  await page.getByLabel('Tiêu đề').fill(title);
  await page.getByLabel('Mô tả').fill('Mạng phòng C3 không kết nối được từ sáng.');
  await page.locator('label[for="sev-High"]').click();
  await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();

  await expect(page).toHaveURL(/\/tickets$/, { timeout: 30000 });
  // Dual layout (desktop table + mobile cards) renders the title twice → take the first.
  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.getByText('Đã tiếp nhận').first()).toBeVisible();
});
