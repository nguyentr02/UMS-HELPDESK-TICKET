import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CredentialHelperNote } from '@/components/auth/credential-helper-note';
import { addCreatedPersona, getCreatedPersonas } from '@/lib/auth/created-personas';

describe('CredentialHelperNote — admin-created personas surface (FE-S15)', () => {
  it('M31-FE-S15-S5: a persona written via addCreatedPersona() appears on the matching role tab', async () => {
    addCreatedPersona({
      id: 'u-test-sv',
      email: 'test.sv@ums.edu.vn',
      password: 'test-sv-secret',
      displayName: 'SV Mới Tạo',
      role: 'SV',
      departmentCode: null,
    });
    // Storage sanity check — the helper merges from this same source.
    expect(getCreatedPersonas().map((p) => p.id)).toContain('u-test-sv');

    render(<CredentialHelperNote open onClose={() => {}} onPick={() => {}} />);

    // SV tab is selected by default — the new persona's displayName shows in the panel.
    const newPersona = await screen.findByText('SV Mới Tạo');
    expect(newPersona).toBeInTheDocument();
  });

  it('M31-FE-S15-S6: created personas are scoped to their role tab (not visible elsewhere)', async () => {
    const user = userEvent.setup();
    addCreatedPersona({
      id: 'u-test-admin',
      email: 'test.admin@ums.edu.vn',
      password: 'test-admin-secret',
      displayName: 'Admin Mới Tạo',
      role: 'Admin',
      departmentCode: null,
    });

    render(<CredentialHelperNote open onClose={() => {}} onPick={() => {}} />);

    // SV tab is active — the Admin persona must NOT appear yet.
    expect(screen.queryByText('Admin Mới Tạo')).not.toBeInTheDocument();

    // Switch to Admin tab — now it should show.
    await user.click(screen.getByRole('tab', { name: 'Vai trò Quản trị viên' }));
    expect(await screen.findByText('Admin Mới Tạo')).toBeInTheDocument();
  });
});
