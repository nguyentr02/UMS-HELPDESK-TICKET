'use client';

import { useRouter } from 'next/navigation';
import { MOCK_ROLES, useSession } from '@/lib/auth/session';
import { homeRouteFor } from '@/lib/auth/nav';
import { useNavigationLoading } from './navigation-loading';
import type { Role } from '@/lib/types/domain';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Dev-only role switcher standing in for SSO. On change, both update the
 * session AND navigate to the new role's home route — otherwise the URL/page
 * keeps showing the previous role's surface.
 */
export function RoleSwitcher() {
  const router = useRouter();
  const { role, setRole } = useSession();
  const { startNavigation } = useNavigationLoading();

  function handleChange(value: string) {
    const next = value as Role;
    const target = homeRouteFor(next);
    // Show the overlay *before* state mutates so the old page never gets a
    // render with the new role visible (which flashes "no permission").
    // Pass `target` so a switch to a role whose home === current path skips
    // the overlay (otherwise pathname never changes and the overlay hangs).
    startNavigation(target);
    setRole(next);
    router.push(target);
  }

  return (
    <Select value={role} onValueChange={handleChange}>
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
