import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';

import { Providers } from './providers';

// Inter is the project font (feature-plan §7.2); `vietnamese` subset for VN glyphs.
// Exposed as `--font-sans`, which Tailwind's `font-sans` resolves to (tailwind.config.ts).
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'M31 Helpdesk',
  description: 'Helpdesk / Ticket — front-end (M31)',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background pb-6 font-sans text-foreground antialiased">
        {/*
          Global copyright bar — fixed at the BOTTOM of the viewport across
          every page, above the AppShell + the /login & landing overlays
          (z-[80]). The body's `pb-6` reserves bar-height space at the bottom
          so the AppShell layout still ends at the viewport bottom without
          spawning a scrollbar. Sidebar / header sticky positions stay at
          `top-0` because the bar no longer competes for the top edge.
        */}
        <div className="fixed inset-x-0 bottom-0 z-[80] flex h-6 items-center justify-center border-t border-slate-800/40 bg-slate-900/90 px-4 text-[11px] tracking-wide text-slate-300 backdrop-blur-sm">
          © 2026 CAIRA-DAU. All rights reserved.
        </div>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
