import type { ApiEnvelope, ApiErrorBody } from '@/lib/types/domain';

/** Thrown for any non-2xx response or an envelope carrying `error`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly requestId: string;

  constructor(status: number, body: ApiErrorBody, requestId: string) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
    this.requestId = requestId;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';

/**
 * Mock-SSO header bridge — used ONLY by the Vitest MSW suite (which still
 * reads `X-Mock-*` to scope mock responses). In the browser these headers
 * piggy-back on every request but the deployed BE ignores them when
 * `AUTH_MODE=jwt` (the prod default), so they're harmless in production.
 * The real auth is the `ums_session` cookie carried by `credentials: 'include'`.
 */
function mockAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem('m31.mockUser');
    if (!raw) return {};
    const u = JSON.parse(raw) as {
      id: string;
      role: string;
      departmentId: string | null;
      displayName?: string;
    };
    return {
      'X-Mock-User-Id': u.id,
      'X-Mock-Role': u.role,
      ...(u.displayName ? { 'X-Mock-Display-Name': encodeURIComponent(u.displayName) } : {}),
      ...(u.departmentId ? { 'X-Mock-Dept-Id': u.departmentId } : {}),
    };
  } catch {
    return {};
  }
}

/**
 * Fetch wrapper for the M31 API: sets JSON content-type (except FormData),
 * attaches the JWT cookie via `credentials: 'include'` (cross-origin), unwraps
 * the `{ data, error, requestId }` envelope, and throws `ApiError` with the
 * HTTP status so callers can map 401/403/404/409/422/5xx (feature-plan §8).
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (!isForm && init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  for (const [k, v] of Object.entries(mockAuthHeaders())) headers.set(k, v);

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  let envelope: ApiEnvelope<T> | undefined;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    envelope = undefined;
  }
  const requestId = envelope?.requestId ?? '';

  if (!res.ok || envelope?.error) {
    const body: ApiErrorBody = envelope?.error ?? {
      code: 'unknown_error',
      message: res.statusText || 'Đã xảy ra lỗi',
    };
    // 401 from any non-/auth/* endpoint = session expired. Fire an event so
    // app/providers.tsx can wipe the persisted cache and let AuthGate bounce
    // the user to /login. /auth/* paths are skipped — useMeQuery already
    // handles its own 401, LoginForm surfaces it inline, and logout is
    // idempotent so we don't want a redirect loop.
    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !path.startsWith('/auth/')
    ) {
      window.dispatchEvent(new CustomEvent('m31:session-expired'));
    }
    throw new ApiError(res.status, body, requestId);
  }

  return envelope?.data as T;
}

export { BASE_URL };
