import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">M31 Helpdesk / Ticket</h1>
      <p className="text-muted-foreground">
        Front-end (Next.js + shadcn/ui) — scaffold đang chạy.
      </p>
      <Button>Bắt đầu</Button>
    </main>
  );
}
