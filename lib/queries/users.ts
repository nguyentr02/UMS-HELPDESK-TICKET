'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createUser, fetchUser, listUsers } from '@/lib/api/users';
import type { CreateUserInput, ListUsersQuery, User } from '@/lib/types/domain';

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
