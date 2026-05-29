'use client';

import { MOCK_ROLES, useSession } from '@/lib/auth/session';
import type { Role } from '@/lib/types/domain';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Dev-only role switcher standing in for SSO. */
export function RoleSwitcher() {
  const { role, setRole } = useSession();
  return (
    <Select value={role} onValueChange={(r) => setRole(r as Role)}>
      <SelectTrigger aria-label="Đổi vai trò (mock)" className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MOCK_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
