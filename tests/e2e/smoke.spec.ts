import { expect,test } from '@playwright/test';

test('home page renders the M31 Helpdesk heading', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'M31 Helpdesk / Ticket' }),
  ).toBeVisible();
});
