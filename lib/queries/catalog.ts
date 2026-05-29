'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/lib/api/categories';
import { listDepartments } from '@/lib/api/departments';
import { listAgents } from '@/lib/api/agents';
import {
  createRoutingRule,
  deleteRoutingRule,
  listRoutingRules,
  updateRoutingRule,
} from '@/lib/api/routing';

export const catalogKeys = {
  categories: ['categories'] as const,
  departments: ['departments'] as const,
  agents: ['agents'] as const,
  routingRules: ['routing-rules'] as const,
};

export const useCategories = () =>
  useQuery({ queryKey: catalogKeys.categories, queryFn: listCategories });

export const useDepartments = () =>
  useQuery({ queryKey: catalogKeys.departments, queryFn: listDepartments });

export const useAgents = () => useQuery({ queryKey: catalogKeys.agents, queryFn: listAgents });

export const useRoutingRules = () =>
  useQuery({ queryKey: catalogKeys.routingRules, queryFn: listRoutingRules });

// ---- Admin mutations (S8) — invalidate the catalog so every consumer (the
// requester create form, the Forward dialog) refetches. ----

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; parentId?: string | null }) => createCategory(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; isActive?: boolean }) =>
      updateCategory(input.id, { name: input.name, isActive: input.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.categories }),
  });
}

export function useCreateRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { categoryId: string; departmentId: string; isDefault?: boolean }) =>
      createRoutingRule(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.routingRules }),
  });
}

export function useUpdateRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; departmentId?: string; isDefault?: boolean }) =>
      updateRoutingRule(input.id, { departmentId: input.departmentId, isDefault: input.isDefault }),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.routingRules }),
  });
}

export function useDeleteRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutingRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.routingRules }),
  });
}
