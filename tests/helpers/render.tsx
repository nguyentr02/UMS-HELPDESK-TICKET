import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '@/lib/auth/session';
import { authKeys } from '@/lib/queries/auth';
import { PERSONAS, defaultPersonaForRole } from '@/mocks/personas';
import { departments as mockDepartments } from '@/mocks/data';
import type { Role } from '@/lib/types/domain';

/**
 * Map a persona's dept CODE → the mock dept CUID used by `mocks/data.ts`.
 * Mirrors the prod BE behavior where `GET /auth/me` returns the resolved cuid
 * on `User.departmentId` (the seed upserts with `deptByCode.get(code)`).
 * Falls back to the code itself when no mock dept matches — keeps test code
 * still functional even if a future persona uses an unmapped code.
 */
function resolveDeptId(deptCode: string | null): string | null {
  if (!deptCode) return null;
  const match = mockDepartments.find((d) => d.code === deptCode);
  return match?.id ?? deptCode;
}

interface RenderOptions {
  /** Role of the persona to seed the session with. Defaults to `'SV'`. */
  role?: Role;
  /** Explicit persona id — overrides `role`. */
  personaId?: string;
  /** Set to `null` to render the tree without a session (anonymous). */
  user?: null;
}

/**
 * Render a component inside the app's client providers with a pre-populated
 * session. Internally pre-fills the `authKeys.me` Query cache so SessionProvider
 * (which derives the user from `useMeQuery`) sees the requested persona on
 * first render — no `GET /auth/me` round-trip in tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  { role = 'SV', personaId, user }: RenderOptions = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  if (user !== null) {
    const persona = personaId
      ? PERSONAS.find((p) => p.id === personaId) ?? defaultPersonaForRole(role)
      : defaultPersonaForRole(role);
    const resolvedDeptId = resolveDeptId(persona.departmentCode);
    client.setQueryData(authKeys.me, {
      user: {
        id: persona.id,
        role: persona.role,
        departmentId: resolvedDeptId,
        displayName: persona.displayName,
      },
    });
    // Also seed `localStorage.m31.mockUser` — `apiFetch` in `lib/api/client.ts`
    // reads this and sends `X-Mock-*` headers so MSW handlers that scope
    // responses by role/dept (`/tickets`, `/users`, etc.) see the test persona.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'm31.mockUser',
        JSON.stringify({
          id: persona.id,
          role: persona.role,
          departmentId: resolvedDeptId,
          displayName: persona.displayName,
        }),
      );
    }
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
