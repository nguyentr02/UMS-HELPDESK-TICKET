'use client';

import { useQuery } from '@tanstack/react-query';

import { getAnalyticsSummary } from '@/lib/api/analytics';

export const analyticsKeys = { summary: ['analytics', 'summary'] as const };

export function useAnalyticsSummary() {
  // Dashboard counts are volatile aggregates, but analytics has no realtime
  // push — so instead of refetching on every visit, treat the cache as fresh
  // for 60s: re-visiting/reloading /analytics within the window serves the
  // cache (no call), and it refetches once when older. Same-session ticket
  // actions still refresh it live via `invalidateTicket`. Trade-off: a change
  // made by someone else can lag up to ~60s on revisit (acceptable for a
  // dashboard); a future `analytics:changed` broadcast would make it live.
  return useQuery({
    queryKey: analyticsKeys.summary,
    queryFn: getAnalyticsSummary,
    staleTime: 60_000,
  });
}
