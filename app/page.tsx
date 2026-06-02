import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Landing splash — mirrors the boot loading screen (DAU brand + logo) but
 * swaps the spinner for a "Bắt đầu" CTA into the app. Rendered as a fixed
 * full-screen overlay so the AppShell chrome stays hidden until the user
 * actively enters the app.
 */
export default function HomePage() {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background p-6"
    >
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

      <Button asChild size="lg" className="gap-2 shadow-sm">
        <Link href="/analytics" aria-label="Bắt đầu vào ứng dụng">
          Bắt đầu
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
