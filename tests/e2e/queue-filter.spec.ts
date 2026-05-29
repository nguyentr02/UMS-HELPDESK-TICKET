import { test, expect } from '@playwright/test';
import { setRole } from './helpers';

// The assignee filter is a shadcn Select (Radix, no jsdom open).
test('a Lead filters the queue by assignee', async ({ page }) => {
  await page.goto('/helpdesk/queue');
  await setRole(page, 'HelpdeskLead');

  const assignee = page.getByRole('combobox', { name: 'Lọc theo nhân viên' });
  await assignee.click();
  await page.getByRole('option', { name: 'Đỗ Thị Mai' }).click();
  await expect(assignee).toContainText('Đỗ Thị Mai');
});
