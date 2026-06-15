'use client';

import { useIsRestoring } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

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
  // While the persisted cache is being restored, paused queries report
  // `isLoading: false` with `data: undefined` — which the caller would read
  // as "empty". Treat restoring as loading so we show the skeleton instead
  // of a fleeting "no data" flash.
  const isRestoring = useIsRestoring();
  if (isLoading || isRestoring) {
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
