'use client';

import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useMarkAllNotificationsRead, useNotifications } from '@/lib/queries/notifications';

/**
 * Page-header action — bulk-marks every unread notification of the caller as
 * read. Hidden when there's nothing to mark, so it doesn't clutter the
 * header in the empty-inbox case.
 */
export function MarkAllReadButton() {
  const { data } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = (data ?? []).filter((n) => !n.readAt).length;

  if (unread === 0) return null;

  async function onClick() {
    try {
      await markAll.mutateAsync();
    } catch {
      toast.error('Không đánh dấu tất cả được. Vui lòng thử lại.');
    }
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={onClick}
      disabled={markAll.isPending}
      aria-label={`Đánh dấu tất cả ${unread} thông báo đã đọc`}
      className="gap-1.5 shadow-sm"
    >
      <CheckCheck className="h-4 w-4" aria-hidden />
      Đánh dấu tất cả đã đọc
    </Button>
  );
}
