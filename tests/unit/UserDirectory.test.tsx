import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserDirectory } from '@/components/admin/user-directory';
import { renderWithProviders } from '../helpers/render';

describe('UserDirectory — Admin user directory page (FE-S14)', () => {
  it('M31-FE-S14-X1: a non-Admin role sees AccessDenied (matrix gate)', async () => {
    renderWithProviders(<UserDirectory />, { role: 'SV' });
    expect(await screen.findByText('Bạn không có quyền truy cập khu vực này.')).toBeInTheDocument();
  });

  it('M31-FE-S14-H1: Admin sees the table with seeded personas', async () => {
    renderWithProviders(<UserDirectory />, { role: 'Admin' });
    // Header
    expect(await screen.findByText('Người dùng')).toBeInTheDocument();
    // The same persona is rendered in BOTH the desktop table and the mobile
    // card list — `findAllByText` matches >= 1 to be tolerant of either.
    const rows = await screen.findAllByText('SV Nguyễn Văn A');
    expect(rows.length).toBeGreaterThan(0);
    // Sensitive columns must not leak — no "passwordHash" or "googleId" anywhere.
    expect(screen.queryByText(/passwordHash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/googleId/i)).not.toBeInTheDocument();
  });

  it('M31-FE-S14-H2: search input filters the visible rows', async () => {
    // delay:null => type synchronously; the live search fires a query per
    // keystroke and the default per-char delay blows the 5s budget under
    // coverage instrumentation.
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<UserDirectory />, { role: 'Admin' });
    await screen.findAllByText('SV Nguyễn Văn A');

    // Filters live in a right-side drawer — open it first, then type.
    await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
    const searchInput = await screen.findByLabelText('Tìm theo tên hoặc email');
    await user.type(searchInput, 'admin');

    // After filtering, the Admin persona should still be visible.
    const adminMatches = await screen.findAllByText('Quản trị viên');
    expect(adminMatches.length).toBeGreaterThan(0);
  });

  it('M31-FE-S14-E1: empty results render the EmptyState copy', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<UserDirectory />, { role: 'Admin' });
    await screen.findAllByText('SV Nguyễn Văn A');

    await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
    const searchInput = await screen.findByLabelText('Tìm theo tên hoặc email');
    await user.type(searchInput, 'zzzzzzzz-no-such-person');

    expect(await screen.findByText('Không có người dùng')).toBeInTheDocument();
  });
});

// Avoid the unused `within` import warning if a future test wants it.
void within;
