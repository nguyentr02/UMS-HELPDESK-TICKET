import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Renders the four interaction states uniformly (feature-plan §8).
 * Pass `isEmpty` to short-circuit to the empty view once data has loaded.
 */
export function DataState({
  isLoading,
  isError,
  isEmpty,
  loading,
  error = 'Đã xảy ra lỗi, vui lòng thử lại.',
  empty,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-2">
        {loading ?? (
          <>
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </>
        )}
      </div>
    );
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (isEmpty) {
    return <>{empty ?? <EmptyState title="Không có dữ liệu" />}</>;
  }
  return <>{children}</>;
}
