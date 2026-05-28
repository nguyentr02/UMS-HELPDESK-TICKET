'use client';

import { MOCK_ROLES, useSession } from '@/lib/auth/session';
import type { Role } from '@/lib/types/domain';

/** Dev-only role switcher standing in for SSO. Native select keeps it test-simple. */
export function RoleSwitcher() {
  const { role, setRole } = useSession();
  return (
    <select
      aria-label="Đổi vai trò (mock)"
      value={role}
      onChange={(e) => setRole(e.target.value as Role)}
      className="rounded-md border bg-background px-2 py-1 text-sm"
    >
      {MOCK_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
