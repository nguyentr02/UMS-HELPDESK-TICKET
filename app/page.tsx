'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSplash } from '@/components/layout/loading-splash';
import { useSession } from '@/lib/auth/session';
import { homeRouteFor } from '@/lib/auth/nav';

const ENTER_DELAY_MS = 2000;

/**
 * Landing splash. Renders as a fixed full-screen overlay so the AppShell
 * chrome stays hidden until the user actively enters. Clicking "Bắt đầu"
 * swaps the landing for the shared LoadingSplash for ENTER_DELAY_MS, then
 * routes into the role-appropriate home (e.g. /analytics for a Lead,
 * /tickets/new for an SV) — matches the intended landing → loading → app
 * flow on first entry without dumping non-Lead users on a 403 surface.
 */
export default function HomePage() {
  const router = useRouter();
  const { role } = useSession();
  const [entering, setEntering] = useState(false);

  function onBegin() {
    if (entering) return;
    setEntering(true);
    const target = homeRouteFor(role);
    // Prefetch can't hurt; the timeout owns the wall-clock so navigation
    // doesn't pre-empt the brand moment.
    router.prefetch(target);
    setTimeout(() => router.push(target), ENTER_DELAY_MS);
  }

  if (entering) return <LoadingSplash />;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dau-logo.png"
          alt="DAU"
          width={120}
          height={120}
          className="h-28 w-28"
        />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">DAU Helpdesk</h1>
      </div>

      <Button
        onClick={onBegin}
        size="lg"
        className="gap-2 shadow-sm"
        aria-label="Bắt đầu vào ứng dụng"
      >
        Bắt đầu
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
