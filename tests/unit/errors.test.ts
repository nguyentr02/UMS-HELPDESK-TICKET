import { beforeEach,describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { CONFLICT_MESSAGE,handleMutationError } from '@/lib/api/errors';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

beforeEach(() => toastError.mockClear());

const apiErr = (status: number, fields?: Record<string, string>) =>
  new ApiError(status, { code: 'x', message: 'boom', fields }, 'r');

describe('handleMutationError (cross-cutting §8 map)', () => {
  it('409 → conflict toast + onConflict', () => {
    const onConflict = vi.fn();
    handleMutationError(apiErr(409), { onConflict });
    expect(toastError).toHaveBeenCalledWith(CONFLICT_MESSAGE);
    expect(onConflict).toHaveBeenCalled();
  });

  it('401 → onUnauthorized, no toast', () => {
    const onUnauthorized = vi.fn();
    handleMutationError(apiErr(401), { onUnauthorized });
    expect(onUnauthorized).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('422 → onFields consumes the error', () => {
    const onFields = vi.fn(() => true);
    handleMutationError(apiErr(422, { title: 'bad' }), { onFields });
    expect(onFields).toHaveBeenCalledWith({ title: 'bad' });
    expect(toastError).not.toHaveBeenCalled();
  });

  it('other ApiError → fallback toast', () => {
    handleMutationError(apiErr(500), {});
    expect(toastError).toHaveBeenCalled();
  });

  it('non-ApiError → fallback message toast', () => {
    handleMutationError(new Error('x'), { fallbackMessage: 'oops' });
    expect(toastError).toHaveBeenCalledWith('oops');
  });
});
