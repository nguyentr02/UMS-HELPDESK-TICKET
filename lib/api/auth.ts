import type { Role } from '@/lib/types/domain';

import { apiFetch, BASE_URL } from './client';

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

/**
 * GET /auth/realtime-token — a short-lived (60 s) JWT for the Socket.IO
 * handshake. Rides the session cookie (via the proxy); throws ApiError(401)
 * when not signed in.
 */
export function fetchRealtimeToken(): Promise<{ token: string }> {
  return apiFetch<{ token: string }>('/auth/realtime-token');
}

/**
 * Build the absolute URL to start a Google OAuth flow — used by
 * `window.location.href = …` (not `fetch`). The BE handles the round-trip
 * and the final redirect back to this FE.
 *
 * `next` is the FE path to land on after the callback succeeds; the BE
 * sanitizes it server-side so we don't trust user-controlled paths.
 */
export function googleLoginUrl(next: string = '/'): string {
  const qs = `?next=${encodeURIComponent(next)}`;
  return `${BASE_URL}/auth/google${qs}`;
}
