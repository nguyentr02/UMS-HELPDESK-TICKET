'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from '@/lib/api/analytics';

export const analyticsKeys = { summary: ['analytics', 'summary'] as const };

export function useAnalyticsSummary() {
  return useQuery({ queryKey: analyticsKeys.summary, queryFn: getAnalyticsSummary });
}
