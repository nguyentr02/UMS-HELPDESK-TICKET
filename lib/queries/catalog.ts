'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listAgents } from '@/lib/api/agents';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/lib/api/categories';
import { listDepartments } from '@/lib/api/departments';

export const catalogKeys = {
  categories: ['categories'] as const,
  departments: ['departments'] as const,
  agents: ['agents'] as const,
};

export const useCategories = () =>
  // Refetch on every mount so admin edits (rename, add, delete, or the "Khác"
  // pin from CategoryService.list) propagate immediately instead of waiting
  // for the global 5-min staleTime to expire on the persisted cache.
  useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
    refetchOnMount: 'always',
  });

export const useDepartments = () =>
  useQuery({ queryKey: catalogKeys.departments, queryFn: listDepartments });

export const useAgents = () => useQuery({ queryKey: catalogKeys.agents, queryFn: listAgents });

// ---- Admin mutations (S8) — categories are now the only Admin-managed
// resource here. Routing rules were removed; agents/leads pick the dept
// per ticket. Departments stay read-only (parent UMS owns them). ----

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) => createCategory(input),
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
