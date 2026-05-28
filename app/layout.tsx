import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'M31 Helpdesk',
  description: 'Helpdesk / Ticket — front-end (M31)',
};

// Note: Inter via next/font is the intended final font (feature-plan §7.2) but is
// deferred to avoid a build-time font fetch; the system sans stack is used for now.
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
