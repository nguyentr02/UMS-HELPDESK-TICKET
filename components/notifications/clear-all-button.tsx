'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClearAllNotifications, useNotifications } from '@/lib/queries/notifications';

/**
 * Page-header action — wipes the entire inbox (read + unread) after the
 * caller confirms. Hidden when there's nothing to clear so it doesn't sit
 * next to "Đánh dấu tất cả đã đọc" in the empty-inbox case.
 */
export function ClearAllButton() {
  const { data } = useNotifications();
  const [open, setOpen] = useState(false);
  const clearAll = useClearAllNotifications();

  const total = data?.length ?? 0;
  const unread = (data ?? []).filter((n) => !n.readAt).length;

  if (total === 0) return null;

  async function onConfirm() {
    try {
      const { deleted } = await clearAll.mutateAsync();
      toast.success(`Đã xoá ${deleted} thông báo.`);
      setOpen(false);
    } catch {
      toast.error('Không xoá được. Vui lòng thử lại.');
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Xoá tất cả ${total} thông báo`}
        className="gap-1.5 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Xoá tất cả
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá tất cả thông báo?</DialogTitle>
            <DialogDescription>
              {unread > 0
                ? `Bạn có ${unread} thông báo chưa đọc. Việc xoá sẽ XOÁ LUÔN cả những thông báo chưa đọc và không thể khôi phục.`
                : `Tất cả ${total} thông báo sẽ bị xoá vĩnh viễn và không thể khôi phục.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={clearAll.isPending}
            >
              Không
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={clearAll.isPending}
            >
              {clearAll.isPending ? 'Đang xoá…' : 'Có, xoá tất cả'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
