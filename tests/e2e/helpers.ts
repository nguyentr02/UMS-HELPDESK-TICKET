import type { Page } from '@playwright/test';

/**
 * Switch the mock SSO role via the shadcn Select role-switcher. The dropdown
 * now lists individual identities labelled `"{role} · {displayName}"` (two
 * each for SV/GV/NV), so this helper picks the *first* option whose label
 * starts with the role name — preserving the existing test contract.
 */
export async function setRole(page: Page, role: string) {
  await page.getByRole('combobox', { name: 'Đổi vai trò (mock)' }).click();
  await page
    .getByRole('option', { name: new RegExp(`^${role}(?: ·|$)`) })
    .first()
    .click();
}
