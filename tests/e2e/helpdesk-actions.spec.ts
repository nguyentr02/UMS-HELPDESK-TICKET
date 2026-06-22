import { expect,test } from '@playwright/test';

import { setRole } from './helpers';

// S3-I1 — assign an agent through the shadcn Combobox (Radix Popover + cmdk), which can't
// open in jsdom. Drives the queue → detail → Assign dialog flow in a real browser.
test('S3-I1: a Lead assigns an agent via the Combobox', async ({ page }) => {
  await page.goto('/helpdesk/queue');
  await setRole(page, 'HelpdeskLead');

  // open the first ticket in the queue (Next dev lazily compiles the [id] route → allow time)
  await page.getByRole('table').getByRole('link').first().click();
  await expect(page).toHaveURL(/\/helpdesk\/tickets\//, { timeout: 30000 });

  await page.getByRole('button', { name: 'Gán nhân viên' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Nhân viên Helpdesk' }).click();
  await page.getByRole('option').first().click();
  await dialog.getByRole('button', { name: 'Gán', exact: true }).click();

  await expect(page.getByText('Đã gán nhân viên Helpdesk.')).toBeVisible();
});
