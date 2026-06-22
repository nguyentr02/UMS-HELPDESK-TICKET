import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from '@/lib/api/client';
import { server } from '@/mocks/server';

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost/api/v1';

function unauth() {
  return HttpResponse.json(
    { data: null, error: { code: 'unauthenticated', message: 'Yêu cầu xác thực' }, requestId: 'r' },
    { status: 401 },
  );
}

describe('apiFetch — session-expired dispatch (FE-S15.5)', () => {
  it('M31-FE-S15-S1: 401 from a non-/auth/* endpoint dispatches m31:session-expired', async () => {
    server.use(http.get(`${base}/analytics/summary`, () => unauth()));
    const listener = vi.fn();
    window.addEventListener('m31:session-expired', listener);
    try {
      await expect(apiFetch('/analytics/summary')).rejects.toBeInstanceOf(ApiError);
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('m31:session-expired', listener);
    }
  });

  it('M31-FE-S15-S2: 401 from /auth/me does NOT dispatch (useMeQuery handles it)', async () => {
    server.use(http.get(`${base}/auth/me`, () => unauth()));
    const listener = vi.fn();
    window.addEventListener('m31:session-expired', listener);
    try {
      await expect(apiFetch('/auth/me')).rejects.toBeInstanceOf(ApiError);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('m31:session-expired', listener);
    }
  });

  it('M31-FE-S15-S3: 401 from /auth/login does NOT dispatch (LoginForm surfaces it inline)', async () => {
    server.use(http.post(`${base}/auth/login`, () => unauth()));
    const listener = vi.fn();
    window.addEventListener('m31:session-expired', listener);
    try {
      await expect(
        apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'x', password: 'y' }) }),
      ).rejects.toBeInstanceOf(ApiError);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('m31:session-expired', listener);
    }
  });

  it('M31-FE-S15-S4: a 403 from any endpoint does NOT dispatch (forbidden ≠ session expired)', async () => {
    server.use(
      http.get(`${base}/users`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'forbidden', message: 'X' }, requestId: 'r' },
          { status: 403 },
        ),
      ),
    );
    const listener = vi.fn();
    window.addEventListener('m31:session-expired', listener);
    try {
      await expect(apiFetch('/users')).rejects.toBeInstanceOf(ApiError);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('m31:session-expired', listener);
    }
  });
});
