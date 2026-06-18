'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { type ReactNode,useEffect, useState } from 'react';

import { AuthGate } from '@/components/auth/auth-gate';
import { AppBootGate } from '@/components/layout/app-boot-gate';
import { NavigationLoadingProvider } from '@/components/layout/navigation-loading';
import { MswReady } from '@/components/providers/msw-ready';
import { SocketProvider } from '@/components/providers/socket-provider';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from '@/lib/auth/session';
import { authKeys } from '@/lib/queries/auth';

const ONE_DAY = 24 * 60 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;

// SSR has no localStorage; render the same provider tree on both sides
// (so hydration matches) and let the persister be a no-op on the server.
const noopPersister = {
  persistClient: async () => {},
  restoreClient: async () => undefined,
  removeClient: async () => {},
};

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: FIVE_MIN,
            gcTime: ONE_DAY,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [persister] = useState(() =>
    typeof window === 'undefined'
      ? noopPersister
      : createSyncStoragePersister({ storage: window.localStorage, key: 'ums-rq-cache' }),
  );

  // Safety net for cookie-expired-but-cache-still-warm: apiFetch fires
  // `m31:session-expired` on any 401 from a non-/auth/* endpoint. Clear every
  // cached query (no previous-user leak), null the me-query (SessionProvider
  // flips to "logged out" → AuthGate redirects), and wipe the persisted cache
  // so a refresh doesn't rehydrate the ghost user.
  useEffect(() => {
    function onSessionExpired() {
      client.clear();
      client.setQueryData(authKeys.me, null);
      void persister.removeClient();
    }
    window.addEventListener('m31:session-expired', onSessionExpired);
    return () => window.removeEventListener('m31:session-expired', onSessionExpired);
  }, [client, persister]);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: ONE_DAY,
        // Identity comes live from /auth/me on every page load — persisting it
        // caused the "ghost user" bug where the chrome showed a stale logged-in
        // user while the BE returned 401 (cookie expired overnight).
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const k0 = query.queryKey[0];
            // Identity comes live from /auth/me on every load (ghost-user fix).
            if (k0 === 'auth' && query.queryKey[1] === 'me') return false;
            // Ticket detail/history/comments (`['ticket', …]`) are access-scoped:
            // a persisted rehydrate could keep showing a ticket the viewer has
            // since lost access to (redirected/closed out of scope) without ever
            // re-hitting the BE. Skip persisting them so a reload re-fetches and
            // the BE's 403 surfaces (→ the graceful out-of-scope card). Lists
            // (`['tickets', …]`) still persist for instant queue paint.
            if (k0 === 'ticket') return false;
            return query.state.status === 'success';
          },
        },
      }}
    >
      <MswReady>
        <SessionProvider>
          <NavigationLoadingProvider>
            <AppBootGate>
              <AuthGate>
                <SocketProvider>{children}</SocketProvider>
              </AuthGate>
            </AppBootGate>
          </NavigationLoadingProvider>
        </SessionProvider>
      </MswReady>
      <Toaster richColors position="top-right" />
    </PersistQueryClientProvider>
  );
}
