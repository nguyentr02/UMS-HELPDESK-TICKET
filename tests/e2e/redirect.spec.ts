import { expect, type Page,test } from '@playwright/test';

/**
 * S18/S19 — redirect dialogs in a REAL browser. jsdom can't drive the Radix
 * Combobox/Dialog, so this validates the one thing unit tests can't: the dept
 * picker opens + a pick registers, and the dialog submits the right payload.
 *
 * Self-contained mock: we stub the BE at the network layer with `page.route`
 * (no MSW service worker, no real backend, no prod data touched).
 */

const envelope = (data: unknown) => ({ data, error: null, requestId: 'e2e' });

const DEPARTMENTS = [
  { id: 'dep-csvc', code: 'CSVC', name: 'Phòng Quản trị CSVC' },
  { id: 'dep-hcns', code: 'HCNS', name: 'Phòng HCNS' },
];

function ticket(over: Record<string, unknown> = {}) {
  return {
    id: 'tk-1',
    code: 'HD-2026-000001',
    title: 'Wifi chậm',
    description: 'mô tả sự cố',
    severity: 'High',
    internalStatus: 'Assigned',
    externalStatus: 'Requested',
    category: null,
    requester: { id: 'u-sv', displayName: 'SV A' },
    helpdeskAssignee: { id: 'u-hdl', displayName: 'Vũ Văn Hùng' },
    routedDepartment: DEPARTMENTS[0],
    attachments: [],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
    closedAt: null,
    backlogAgeDays: 0,
    ...over,
  };
}

/** Stub every BE call the ticket-detail screens make. `capture` receives the
 *  body of the redirect/request POST so the test can assert the payload. */
async function stubBackend(
  page: Page,
  opts: { user: Record<string, unknown>; status: string; capture: (body: unknown) => void },
) {
  const json = (data: unknown) => ({ contentType: 'application/json', body: JSON.stringify(envelope(data)) });
  // CRITICAL: anchor every matcher to the BE origin (`vercel.app`). Playwright
  // intercepts the top-level document navigation too, so a bare `/tickets/tk-1`
  // regex would also match the app route `http://localhost:3000/helpdesk/tickets/tk-1`
  // and serve raw JSON instead of letting the page render. Scoping to the API
  // host lets localhost page loads pass through untouched.
  // Catch-all first (lowest priority); specific routes registered after win.
  await page.route(/vercel\.app\//, (r) => r.fulfill(json(null)));
  await page.route(/vercel\.app\/auth\/me(\?|$)/, (r) => r.fulfill(json({ user: opts.user })));
  await page.route(/vercel\.app\/notifications(\?|$)/, (r) => r.fulfill(json([])));
  await page.route(/vercel\.app\/departments(\?|$)/, (r) => r.fulfill(json(DEPARTMENTS)));
  await page.route(/vercel\.app\/tickets\/tk-1\/history/, (r) => r.fulfill(json([])));
  await page.route(/vercel\.app\/tickets\/tk-1\/comments/, (r) => r.fulfill(json([])));
  await page.route(/vercel\.app\/tickets\/tk-1\/(request-redirect|redirect)/, async (r) => {
    opts.capture(r.request().postDataJSON());
    await r.fulfill(json(ticket({ internalStatus: 'Assigned', routedDepartment: DEPARTMENTS[1] })));
  });
  await page.route(/vercel\.app\/tickets\/tk-1(\?|$)/, (r) => r.fulfill(json(ticket({ internalStatus: opts.status }))));
}

test('M31-E2E-S18: Lead redirects a ticket via the real dept picker', async ({ page }) => {
  const body: { departmentId?: string; reason?: string } = {};
  await stubBackend(page, {
    user: { id: 'u-hdl', role: 'HelpdeskLead', departmentId: null, displayName: 'Vũ Văn Hùng' },
    status: 'Assigned',
    capture: (b) => Object.assign(body, b),
  });

  await page.goto('/helpdesk/tickets/tk-1');
  await expect(page.getByText('Wifi chậm')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Chuyển phòng khác' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Phòng ban mới' }).click();
  await page.getByRole('option', { name: 'Phòng HCNS' }).click();
  await dialog.getByLabel('Lý do chuyển phòng ban').fill('Thuộc phạm vi HCNS');
  await dialog.getByRole('button', { name: 'Chuyển' }).click();

  await expect.poll(() => body?.departmentId).toBe('dep-hcns');
  expect(body?.reason).toBe('Thuộc phạm vi HCNS');
});

test('M31-E2E-S19: DeptStaff requests a redirect (reason only)', async ({ page }) => {
  const body: { reason?: string } = {};
  await stubBackend(page, {
    user: { id: 'u-staff', role: 'DeptStaff', departmentId: 'dep-csvc', displayName: 'Phan Thị Hương' },
    status: 'InProgress',
    capture: (b) => Object.assign(body, b),
  });

  await page.goto('/staff/tickets/tk-1');
  await expect(page.getByText('Wifi chậm')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Xin chuyển phòng ban' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Lý do xin chuyển phòng ban').fill('Ticket này không thuộc phòng tôi');
  await dialog.getByRole('button', { name: 'Gửi yêu cầu' }).click();

  await expect.poll(() => body?.reason).toBe('Ticket này không thuộc phòng tôi');
});