'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { handleMutationError } from '@/lib/api/errors';
import { invalidateTicket, useCloseTicket } from '@/lib/queries/helpdesk';
import type { Ticket } from '@/lib/types/domain';

/** S7 — Helpdesk closes (Lead or assigned Agent); terminal, optional resolution note. */
export function CloseDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const close = useCloseTicket(ticket.id);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  async function onConfirm() {
    try {
      await close.mutateAsync(note.trim() ? note.trim() : undefined);
      toast.success('Đã đóng yêu cầu.');
      setOpen(false);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        fallbackMessage: 'Không đóng được yêu cầu.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Đóng yêu cầu</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đóng yêu cầu</DialogTitle>
          <DialogDescription>
            Yêu cầu sẽ chuyển sang <strong>Hoàn tất</strong> và không thể mở lại.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="close-note">Ghi chú xử lý (tuỳ chọn)</Label>
          <Textarea
            id="close-note"
            rows={3}
            placeholder="Tóm tắt cách xử lý (tuỳ chọn)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={close.isPending}>
            {close.isPending ? 'Đang đóng…' : 'Đóng yêu cầu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
