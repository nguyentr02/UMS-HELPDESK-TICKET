'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, type ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session';
import { NavigationLoadingProvider } from '@/components/layout/navigation-loading';
import { Toaster } from '@/components/ui/sonner';
import { MswReady } from '@/components/providers/msw-ready';

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

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: ONE_DAY }}
    >
      <SessionProvider>
        <MswReady>
          <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
        </MswReady>
      </SessionProvider>
      <Toaster richColors position="top-right" />
    </PersistQueryClientProvider>
  );
}
