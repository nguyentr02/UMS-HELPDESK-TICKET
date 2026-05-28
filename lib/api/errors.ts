import { toast } from 'sonner';
import { ApiError } from './client';

/** Shown when a state transition raced another actor (HTTP 409) — feature-plan §8. */
export const CONFLICT_MESSAGE = 'Hành động không còn hợp lệ. Đang làm mới…';

export interface MutationErrorHandlers {
  /** Called on 409 — typically refetch the ticket and close the dialog. */
  onConflict?: () => void;
  /** Called on 401 — typically route to login. */
  onUnauthorized?: () => void;
  /** Called on 422 with field errors; return `true` if the error was consumed. */
  onFields?: (fields: Record<string, string>) => boolean | void;
  /** Toast shown for any unmapped error. */
  fallbackMessage?: string;
}

/**
 * Maps an ApiError to the cross-cutting FE behaviour (feature-plan §8):
 * 401→login, 409→"refresh", 422→field errors, else→toast. Unhandled branches
 * fall through to a fallback toast so the user is never left guessing.
 */
export function handleMutationError(err: unknown, handlers: MutationErrorHandlers = {}): void {
  if (err instanceof ApiError) {
    if (err.status === 401 && handlers.onUnauthorized) {
      handlers.onUnauthorized();
      return;
    }
    if (err.status === 409) {
      toast.error(CONFLICT_MESSAGE);
      handlers.onConflict?.();
      return;
    }
    if (err.status === 422 && err.fields && handlers.onFields?.(err.fields)) {
      return;
    }
    toast.error(err.message || handlers.fallbackMessage || 'Đã xảy ra lỗi, vui lòng thử lại.');
    return;
  }
  toast.error(handlers.fallbackMessage ?? 'Đã xảy ra lỗi, vui lòng thử lại.');
}
