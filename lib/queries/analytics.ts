'use client';

import { useQuery } from '@tanstack/react-query';

import { getAnalyticsSummary } from '@/lib/api/analytics';

export const analyticsKeys = { summary: ['analytics', 'summary'] as const };

export function useAnalyticsSummary() {
  // Dashboard counts are volatile aggregates — always refetch on mount so
  // navigating to /analytics shows live numbers, never a stale value served
  // from the 24h-persisted query cache. (Transitions also invalidate this key
  // via `invalidateTicket`, but that only helps an already-open dashboard.)
  return useQuery({
    queryKey: analyticsKeys.summary,
    queryFn: getAnalyticsSummary,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
