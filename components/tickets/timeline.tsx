'use client';

import { useMemo, useState } from 'react';

import { EVENT_VI } from '@/lib/status/status';
import type { TicketEvent } from '@/lib/types/domain';

/** Show this many events, with a "Xem thêm" to reveal the rest. */
const INITIAL_VISIBLE = 3;

/** Audit trail (S10) — chronological events with actor + timestamp. */
export function Timeline({ events }: { events: TicketEvent[] }) {
  const [expanded, setExpanded] = useState(false);

  // Newest-first for display. Memoized so the array identity is stable across
  // re-renders (e.g. toggling expand).
  const sorted = useMemo(
    () => [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [events],
  );

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>;
  }

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sorted.length - INITIAL_VISIBLE;

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-4 border-l pl-5">
        {visible.map((e) => (
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

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start rounded-md px-1 py-0.5 text-sm font-medium text-red-700 outline-none transition-colors hover:text-red-800 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? 'Thu gọn' : `Xem thêm (${hiddenCount} hoạt động cũ hơn)`}
        </button>
      ) : null}
    </div>
  );
}
