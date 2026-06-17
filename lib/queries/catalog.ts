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

// Reference data (categories/departments/agents) changes rarely, so treat it as
// fresh for a long window: reloads/navigation serve from the persisted cache
// with NO network call. Freshness on change comes from the mutations below
// (which invalidate on success) — and can be made live cross-client via a
// `categories:changed` socket event. Previously `useCategories` used
// `refetchOnMount: 'always'`, which re-hit /categories on EVERY mount/reload.
const REFERENCE_DATA_STALE_TIME = 30 * 60 * 1000; // 30 min

export const useCategories = () =>
  useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });

export const useDepartments = () =>
  useQuery({
    queryKey: catalogKeys.departments,
    queryFn: listDepartments,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });

export const useAgents = () =>
  useQuery({
    queryKey: catalogKeys.agents,
    queryFn: listAgents,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });

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
