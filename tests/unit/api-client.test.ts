import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { apiFetch, ApiError } from '@/lib/api/client';

const base = process.env.NEXT_PUBLIC_API_BASE_URL as string;

describe('apiFetch (envelope + error mapping)', () => {
  it('unwraps the data envelope on success', async () => {
    server.use(
      http.get(`${base}/ok`, () =>
        HttpResponse.json({ data: { hello: 'world' }, error: null, requestId: 'r1' }),
      ),
    );
    await expect(apiFetch('/ok')).resolves.toEqual({ hello: 'world' });
  });

  it.each([
    ['/e401', 401],
    ['/e403', 403],
    ['/e404', 404],
    ['/e409', 409],
    ['/e422', 422],
    ['/e500', 500],
  ])('maps %s → ApiError with status %i', async (path, status) => {
    server.use(
      http.get(`${base}${path}`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'x', message: 'boom' }, requestId: 'r' },
          { status },
        ),
      ),
    );
    await expect(apiFetch(path)).rejects.toMatchObject({ status, code: 'x' });
  });

  it('throws an ApiError instance carrying field errors on 422', async () => {
    server.use(
      http.post(`${base}/v`, () =>
        HttpResponse.json(
          {
            data: null,
            error: { code: 'validation_error', message: 'bad', fields: { title: 'too short' } },
            requestId: 'r',
          },
          { status: 422 },
        ),
      ),
    );
    try {
      await apiFetch('/v', { method: 'POST', body: JSON.stringify({}) });
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).fields).toEqual({ title: 'too short' });
    }
  });
});
