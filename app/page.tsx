'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, KeyRound, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSplash } from '@/components/layout/loading-splash';
import { useSessionOptional } from '@/lib/auth/session';
import { homeRouteFor } from '@/lib/auth/nav';

const ENTER_DELAY_MS = 2000;
// Last 500 ms of the splash plays the scale-up + fade-out exit animation
// (matches the transition `duration-500` in LoadingSplash).
const EXIT_ANIMATION_MS = 500;

const FEATURES = [
  { icon: KeyRound, label: 'Account hỗ trợ' },
  { icon: Settings, label: 'Technical issues' },
  { icon: BookOpen, label: 'Knowledge base' },
];

/**
 * Landing splash — brand mark + tagline + role-aware "Bắt đầu" CTA, with the
 * three top-level helpdesk pillars surfaced as a quick communicative row.
 * Fixed full-screen overlay so the AppShell chrome stays hidden until the
 * user actively enters. Clicking "Bắt đầu" swaps the page for the shared
 * LoadingSplash for ENTER_DELAY_MS, then routes into the role-appropriate
 * home (e.g. /analytics for a Lead, /tickets/new for an SV).
 */
type Phase = 'idle' | 'loading' | 'exiting';

export default function HomePage() {
  const router = useRouter();
  const ctx = useSessionOptional();
  const [phase, setPhase] = useState<Phase>('idle');

  function onBegin() {
    if (phase !== 'idle') return;
    setPhase('loading');
    // Logged-in → role's home; logged-out → /login. The AuthGate handles the
    // edge case where `useMeQuery` is still pending (it shows the splash).
    const target = ctx?.user ? homeRouteFor(ctx.user.role) : '/login';
    router.prefetch(target);
    setTimeout(() => setPhase('exiting'), ENTER_DELAY_MS - EXIT_ANIMATION_MS);
    setTimeout(() => router.push(target), ENTER_DELAY_MS);
  }

  if (phase !== 'idle') return <LoadingSplash exiting={phase === 'exiting'} />;

  return (
    <div className="fixed inset-0 z-40 isolate flex flex-col overflow-hidden bg-background">
      {/* Background watermark layer — blurred slightly, scaled to hide the
          blur edge, behind the content via the parent's isolation context. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 scale-110 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: "url('/landing-bg.png')" }}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dau-logo.png"
          alt="DAU"
          width={180}
          height={180}
          className="h-36 w-36 [filter:drop-shadow(0_0_24px_rgba(220,38,38,0.55))] sm:h-44 sm:w-44"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground [text-shadow:0_0_20px_rgba(15,23,42,0.45)] sm:text-5xl">
            DAU Helpdesk
          </h1>
          <p className="text-base text-slate-700 [text-shadow:0_0_14px_rgba(51,65,85,0.4)] sm:text-lg">
            Giải pháp hỗ trợ nhanh chóng và hiệu quả
          </p>
        </div>

        <Button
          onClick={onBegin}
          size="lg"
          className="h-12 gap-2 px-8 text-base shadow-[0_0_28px_rgba(15,23,42,0.55)]"
          aria-label="Bắt đầu vào ứng dụng"
        >
          Bắt đầu
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Button>

        <div className="mt-8 hidden w-full max-w-3xl gap-8 sm:grid sm:grid-cols-3 sm:gap-16">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 text-center">
              <Icon
                className="h-10 w-10 text-red-600 [filter:drop-shadow(0_0_18px_rgba(220,38,38,0.55))]"
                aria-hidden
              />
              <span className="text-base font-medium text-foreground [text-shadow:0_0_12px_rgba(15,23,42,0.4)]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
