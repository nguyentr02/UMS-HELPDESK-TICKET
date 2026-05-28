import { apiFetch } from './client';
import type { RoutingRule } from '@/lib/types/domain';

export const listRoutingRules = () => apiFetch<RoutingRule[]>('/routing-rules');

export const createRoutingRule = (input: {
  categoryId: string;
  departmentId: string;
  isDefault?: boolean;
}) => apiFetch<RoutingRule>('/routing-rules', { method: 'POST', body: JSON.stringify(input) });

export const updateRoutingRule = (
  id: string,
  input: Partial<{ departmentId: string; isDefault: boolean }>,
) => apiFetch<RoutingRule>(`/routing-rules/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const deleteRoutingRule = (id: string) =>
  apiFetch<{ id: string }>(`/routing-rules/${id}`, { method: 'DELETE' });
