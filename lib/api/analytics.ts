import type { AnalyticsSummary } from '@/lib/types/domain';

import { apiFetch } from './client';

export const getAnalyticsSummary = () => apiFetch<AnalyticsSummary>('/analytics/summary');
