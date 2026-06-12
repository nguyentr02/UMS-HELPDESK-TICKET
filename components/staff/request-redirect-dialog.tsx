'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { invalidateTicket, useRequestRedirect } from '@/lib/queries/helpdesk';
import { handleMutationError } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * S19 — DeptStaff asks Helpdesk to move the ticket to another department, with
 * a reason (no target — the reviewing Agent/Lead picks the destination). Status
 * → RedirectRequested awaiting review.
 */
export function RequestRedirectDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const requestRedirect = useRequestRedirect(ticket.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  async function onConfirm() {
    if (reason.trim().length < 1) {
      setError('Cần lý do xin chuyển phòng ban');
      return;
    }
    setError(undefined);
    try {
      await requestRedirect.mutateAsync(reason.trim());
      toast.success('Đã gửi yêu cầu chuyển phòng ban. Chờ Helpdesk duyệt.');
      setOpen(false);
      setReason('');
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          if (f.reason) {
            setError(f.reason);
            return true;
          }
        },
        fallbackMessage: 'Không gửi được yêu cầu chuyển phòng ban.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Xin chuyển phòng ban</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xin chuyển phòng ban</DialogTitle>
          <DialogDescription>
            Nêu lý do để Helpdesk duyệt và chọn phòng ban phù hợp. Yêu cầu sẽ chuyển sang{' '}
            <strong>Chờ duyệt chuyển</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="request-redirect-reason">
            Lý do <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="request-redirect-reason"
            rows={3}
            placeholder="Vì sao ticket này không thuộc phòng bạn…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Lý do xin chuyển phòng ban"
          />
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={requestRedirect.isPending}>
            {requestRedirect.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}