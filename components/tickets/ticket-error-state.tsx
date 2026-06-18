import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ApiError } from '@/lib/api/client';

/**
 * Graceful "ticket can't be shown" state for the detail pages — replaces a bare
 * red error line. Maps the failure to friendly copy and always offers a way
 * back to the list. A 403 (lost access — e.g. the ticket was closed/redirected
 * out of the viewer's scope) and 404 read as expected states, not errors;
 * `Thử lại` only shows for transient/server errors where a refetch can help.
 */
export function TicketErrorState({
  error,
  backHref,
  backLabel,
  onRetry,
}: {
  error: unknown;
  backHref: string;
  backLabel: string;
  onRetry?: () => void;
}) {
  const status = error instanceof ApiError ? error.status : 0;

  const { title, description } =
    status === 403
      ? {
          title: 'Yêu cầu không còn trong phạm vi của bạn',
          description: 'Yêu cầu có thể đã được đóng hoặc chuyển sang phòng ban khác.',
        }
      : status === 404
        ? {
            title: 'Không tìm thấy yêu cầu',
            description: 'Yêu cầu có thể đã bị xoá hoặc không tồn tại.',
          }
        : {
            title: 'Không tải được yêu cầu',
            description: 'Đã xảy ra lỗi khi tải yêu cầu. Vui lòng thử lại.',
          };

  const showRetry = !!onRetry && status !== 403 && status !== 404;

  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {showRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          ) : null}
          <Button asChild variant={showRetry ? 'default' : 'outline'}>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      }
    />
  );
}