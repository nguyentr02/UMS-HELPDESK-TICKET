'use client';

import { useRouter } from 'next/navigation';
import { MOCK_IDENTITIES, useSession } from '@/lib/auth/session';
import { homeRouteFor } from '@/lib/auth/nav';
import { useNavigationLoading } from './navigation-loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Dev-only identity switcher standing in for SSO. Options are individual mock
 * identities (multiple per role for SV/GV/NV so cross-user scenarios can be
 * exercised). The label format is `{role} · {displayName}` so the e2e helper
 * that selects by partial role name still works.
 */
export function RoleSwitcher() {
  const router = useRouter();
  const { user, setIdentity } = useSession();
  const { startNavigation } = useNavigationLoading();

  function handleChange(value: string) {
    const next = MOCK_IDENTITIES.find((u) => u.id === value);
    if (!next) return;
    const target = homeRouteFor(next.role);
    startNavigation(target);
    setIdentity(next.id);
    router.push(target);
  }

  return (
    <Select value={user.id} onValueChange={handleChange}>
      <SelectTrigger aria-label="Đổi vai trò (mock)" className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MOCK_IDENTITIES.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.role} · {u.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
