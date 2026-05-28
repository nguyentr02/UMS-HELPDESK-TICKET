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
 * Mock-SSO shim: forwards the current mock identity as headers so the MSW
 * handlers can scope responses (requester→own, dept→dept, helpdesk/admin→all).
 * A real SSO integration replaces this with a bearer token.
 */
function mockAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem('m31.mockUser');
    if (!raw) return {};
    const u = JSON.parse(raw) as { id: string; role: string; departmentId: string | null };
    return {
      'X-Mock-User-Id': u.id,
      'X-Mock-Role': u.role,
      ...(u.departmentId ? { 'X-Mock-Dept-Id': u.departmentId } : {}),
    };
  } catch {
    return {};
  }
}

/**
 * Fetch wrapper for the M31 API: sets JSON content-type (except FormData),
 * attaches the mock-SSO headers, unwraps the `{ data, error, requestId }`
 * envelope, and throws `ApiError` with the HTTP status so callers can map
 * 401/403/404/409/422/5xx (feature-plan §8).
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (!isForm && init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  for (const [k, v] of Object.entries(mockAuthHeaders())) headers.set(k, v);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

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
    throw new ApiError(res.status, body, requestId);
  }

  return envelope?.data as T;
}

export { BASE_URL };
