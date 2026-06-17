'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createUser, deactivateUser, fetchUser, listUsers, updateUser } from '@/lib/api/users';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput, User } from '@/lib/types/domain';

export const userKeys = {
  all: ['users'] as const,
  list: (q: ListUsersQuery) => ['users', 'list', q] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

/**
 * Paged user directory hook. The query object is keyed verbatim so filter
 * changes (role / departmentId / search / page / pageSize) cache
 * independently — no manual invalidation needed when the user changes a
 * filter dropdown.
 */
export const useUsers = (query: ListUsersQuery = {}) =>
  useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => listUsers(query),
    // Keep the current page on screen while the next page/filter loads — no
    // loading flash when paging through or tweaking a filter.
    placeholderData: keepPreviousData,
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });

/** Admin-only create user mutation. On success invalidates the list cache and
 *  primes the detail cache for the new id so the post-create redirect renders
 *  instantly. */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: (created: User) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.setQueryData(userKeys.detail(created.id), created);
    },
  });
}

/** Admin-only update mutation. Invalidates list + writes the fresh DTO into
 *  the detail cache so the redirect after save shows the new values. */
export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(id, input),
    onSuccess: (updated: User) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.setQueryData(userKeys.detail(updated.id), updated);
    },
  });
}

/** Admin-only soft-delete mutation. Invalidates list + detail (the soft-deleted
 *  row still exists, just with `isActive=false` server-side — the DTO doesn't
 *  expose that flag today, but the cache should refresh anyway). */
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: (deactivated: User) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.setQueryData(userKeys.detail(deactivated.id), deactivated);
    },
  });
}
