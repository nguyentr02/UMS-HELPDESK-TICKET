import type { TicketEvent } from '@/lib/types/domain';
import { EVENT_VI } from '@/lib/status/status';

/** Audit trail (S10) — chronological events with actor + timestamp. */
export function Timeline({ events }: { events: TicketEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>;
  }
  return (
    <ol className="flex flex-col gap-4 border-l pl-5">
      {events.map((e) => (
        <li key={e.id} className="text-sm leading-relaxed">
          <time className="text-muted-foreground" dateTime={e.createdAt}>
            {new Date(e.createdAt).toLocaleString('vi-VN')}
          </time>
          <span className="mx-1">·</span>
          <span className="font-medium">{EVENT_VI[e.type]}</span>
          <span className="mx-1">—</span>
          <span>{e.actor.displayName}</span>
          {e.note ? <p className="text-muted-foreground">{e.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
