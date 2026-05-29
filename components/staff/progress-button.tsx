'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { invalidateTicket, useStartProgress } from '@/lib/queries/helpdesk';
import { ApiError } from '@/lib/api/client';
import { handleMutationError } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';

/** S6 — mark an `Assigned` ticket as In Progress (→ requester sees "Đang xử lý"). */
export function ProgressButton({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const progress = useStartProgress(ticket.id);

  async function onClick() {
    try {
      await progress.mutateAsync();
      toast.success('Đã chuyển sang Đang xử lý.');
    } catch (err) {
      // 403 (not your dept) → refetch so the detail re-gates; 409 handled below.
      if (err instanceof ApiError && err.status === 403) invalidateTicket(qc, ticket.id);
      handleMutationError(err, {
        onConflict: () => invalidateTicket(qc, ticket.id),
        fallbackMessage: 'Không cập nhật được trạng thái.',
      });
    }
  }

  return (
    <Button onClick={onClick} disabled={progress.isPending}>
      {progress.isPending ? 'Đang cập nhật…' : 'Bắt đầu xử lý'}
    </Button>
  );
}
