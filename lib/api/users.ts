import { apiFetch } from './client';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput, User, UserListResponse } from '@/lib/types/domain';

function buildQuery(q: ListUsersQuery): string {
  const params = new URLSearchParams();
  if (q.role) params.set('role', q.role);
  if (q.departmentId) params.set('departmentId', q.departmentId);
  if (q.search && q.search.trim().length > 0) params.set('search', q.search.trim());
  if (q.page) params.set('page', String(q.page));
  if (q.pageSize) params.set('pageSize', String(q.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Admin-only: paged user directory. Server caps pageSize at 100. */
export const listUsers = (q: ListUsersQuery = {}) =>
  apiFetch<UserListResponse>(`/users${buildQuery(q)}`);

/** Admin-only: single user lookup. Throws ApiError(404) when missing. */
export const fetchUser = (id: string) => apiFetch<User>(`/users/${encodeURIComponent(id)}`);

/** Admin-only: create a user. 409 on duplicate email, 422 on validation, 403 for non-admin. */
export const createUser = (input: CreateUserInput) =>
  apiFetch<User>('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

/** Admin-only: partial update. 404 if user doesn't exist, 422 on validation, 403 for non-admin. */
export const updateUser = (id: string, input: UpdateUserInput) =>
  apiFetch<User>(`/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

/** Admin-only: soft delete (deactivate). 409 if admin targets themselves. */
export const deactivateUser = (id: string) =>
  apiFetch<User>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
