import type { Role } from '@/lib/types/domain';
import { apiFetch } from './client';

export interface SessionUser {
  id: string;
  role: Role;
  departmentId: string | null;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthEnvelope {
  user: SessionUser;
}

/** POST /auth/login — sets the session cookie; returns the session user. */
export function loginRequest(body: LoginRequest): Promise<AuthEnvelope> {
  return apiFetch<AuthEnvelope>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** POST /auth/logout — clears the session cookie. Idempotent. */
export function logoutRequest(): Promise<Record<string, never>> {
  return apiFetch<Record<string, never>>('/auth/logout', { method: 'POST' });
}

/** GET /auth/me — returns the current session user, or throws ApiError(401) if no valid cookie. */
export function fetchMe(): Promise<AuthEnvelope> {
  return apiFetch<AuthEnvelope>('/auth/me');
}
