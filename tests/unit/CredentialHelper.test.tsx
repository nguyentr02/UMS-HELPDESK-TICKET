import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CredentialHelperNote } from '@/components/auth/credential-helper-note';
import {
  addCreatedPersona,
  getCreatedPersonas,
  removeCreatedPersona,
  updateCreatedPersona,
} from '@/lib/auth/created-personas';

describe('CredentialHelperNote — admin-created personas surface (FE-S15)', () => {
  it('M31-FE-S15-S5: a persona written via addCreatedPersona() appears on the matching role tab', async () => {
    addCreatedPersona({
      id: 'u-test-sv',
      email: 'test.sv@ums.edu.vn',
      displayName: 'SV Mới Tạo',
      role: 'SV',
      departmentCode: null,
    });
    expect(getCreatedPersonas().map((p) => p.id)).toContain('u-test-sv');

    render(<CredentialHelperNote open onClose={() => {}} onPick={() => {}} />);
    expect(await screen.findByText('SV Mới Tạo')).toBeInTheDocument();
  });

  it('M31-FE-S15-S6: created personas are scoped to their role tab (not visible elsewhere)', async () => {
    const user = userEvent.setup();
    addCreatedPersona({
      id: 'u-test-admin',
      email: 'test.admin@ums.edu.vn',
      displayName: 'Admin Mới Tạo',
      role: 'Admin',
      departmentCode: null,
    });

    render(<CredentialHelperNote open onClose={() => {}} onPick={() => {}} />);
    expect(screen.queryByText('Admin Mới Tạo')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Vai trò Quản trị viên' }));
    expect(await screen.findByText('Admin Mới Tạo')).toBeInTheDocument();
  });

  it('M31-FE-S15-S7: clicking a created persona reveals email + a "type your own password" hint (no password leak)', async () => {
    const user = userEvent.setup();
    addCreatedPersona({
      id: 'u-test-pw-hidden',
      email: 'test.nopw@ums.edu.vn',
      displayName: 'SV Không Có Mật Khẩu',
      role: 'SV',
      departmentCode: null,
    });

    render(<CredentialHelperNote open onClose={() => {}} onPick={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Chọn persona SV Không Có Mật Khẩu' }));

    expect(await screen.findByText('test.nopw@ums.edu.vn')).toBeInTheDocument();
    expect(screen.getByText('Tự nhập mật khẩu khi đăng nhập')).toBeInTheDocument();
    // Make sure no password label/value sneaks in for created personas.
    const matches = screen.queryAllByText((_, node) => node?.textContent === 'Mật khẩu: ');
    expect(matches.length).toBe(0);
  });

  it('M31-FE-S16-S1: updateCreatedPersona() moves a persona from GV to DeptStaff (PATCH sync)', () => {
    addCreatedPersona({
      id: 'u-test-gv',
      email: 'gv.new@ums.edu.vn',
      displayName: 'GV Mới',
      role: 'GV',
      departmentCode: null,
    });
    updateCreatedPersona('u-test-gv', { role: 'DeptStaff', departmentCode: 'CSVC' });
    const after = getCreatedPersonas().find((p) => p.id === 'u-test-gv');
    expect(after?.role).toBe('DeptStaff');
    expect(after?.departmentCode).toBe('CSVC');
    // Email + id should be untouched.
    expect(after?.email).toBe('gv.new@ums.edu.vn');
  });

  it('M31-FE-S16-S2: updateCreatedPersona() is a no-op for seeded persona ids', () => {
    // u-sv-1 is a seeded persona, not in localStorage at all.
    updateCreatedPersona('u-sv-1', { role: 'Admin' });
    expect(getCreatedPersonas().find((p) => p.id === 'u-sv-1')).toBeUndefined();
  });

  it('M31-FE-S16-S3: removeCreatedPersona() drops the entry from the credential helper (soft-delete sync)', async () => {
    addCreatedPersona({
      id: 'u-test-soft-deleted',
      email: 'softdel@ums.edu.vn',
      displayName: 'Sắp Bị Xóa',
      role: 'SV',
      departmentCode: null,
    });
    render(<CredentialHelperNote open onClose={() => {}} onPick={() => {}} />);
    expect(await screen.findByText('Sắp Bị Xóa')).toBeInTheDocument();
    removeCreatedPersona('u-test-soft-deleted');
    expect(getCreatedPersonas().find((p) => p.id === 'u-test-soft-deleted')).toBeUndefined();
  });

  it('M31-FE-S15-S8: getCreatedPersonas() strips and rewrites a stored entry that still carries a password (v1 migration)', () => {
    // Simulate a v1 entry that leaked a plain-text password into localStorage.
    window.localStorage.setItem(
      'm31.createdPersonas',
      JSON.stringify([
        {
          id: 'u-legacy',
          email: 'legacy@ums.edu.vn',
          password: 'oh-no-cleartext',
          displayName: 'Legacy',
          role: 'SV',
          departmentCode: null,
        },
      ]),
    );

    const list = getCreatedPersonas();
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty('password');
    // On-disk should also be scrubbed so a second read can't recover it.
    const raw = window.localStorage.getItem('m31.createdPersonas') ?? '[]';
    expect(raw).not.toContain('oh-no-cleartext');
    expect(raw).not.toContain('password');
  });
});
