import { apiFetch } from './client';
import type { AnalyticsSummary } from '@/lib/types/domain';

export const getAnalyticsSummary = () => apiFetch<AnalyticsSummary>('/analytics/summary');
