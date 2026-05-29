import type { Page } from '@playwright/test';

/** Switch the mock SSO role via the shadcn Select role-switcher (open → pick option). */
export async function setRole(page: Page, role: string) {
  await page.getByRole('combobox', { name: 'Đổi vai trò (mock)' }).click();
  await page.getByRole('option', { name: role, exact: true }).click();
}
