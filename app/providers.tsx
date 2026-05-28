'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session';
import { Toaster } from '@/components/ui/sonner';
import { MswReady } from '@/components/providers/msw-ready';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        <MswReady>{children}</MswReady>
      </SessionProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
