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
import { invalidateTicket, useApproveClose, useRefuseClose } from '@/lib/queries/helpdesk';
import type { Ticket } from '@/lib/types/domain';

/**
 * S17 — the owning Agent/Lead reviews a DeptStaff close request. The proof
 * (comment + images) shows in the timeline below; here they Approve (→ Closed,
 * optional note) or Refuse (→ back to In Progress, reason required).
 */
export function ReviewCloseDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const approve = useApproveClose(ticket.id);
  const refuse = useRefuseClose(ticket.id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [refuseReason, setRefuseReason] = useState('');
  const [refuseError, setRefuseError] = useState<string | undefined>(undefined);

  async function onApprove() {
    try {
      await approve.mutateAsync(approveNote.trim() ? approveNote.trim() : undefined);
      toast.success('Đã duyệt đóng yêu cầu.');
      setApproveOpen(false);
      setApproveNote('');
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setApproveOpen(false);
        },
        fallbackMessage: 'Không duyệt được yêu cầu đóng.',
      });
    }
  }

  async function onRefuse() {
    if (refuseReason.trim().length < 1) {
      setRefuseError('Cần lý do từ chối');
      return;
    }
    setRefuseError(undefined);
    try {
      await refuse.mutateAsync(refuseReason.trim());
      toast.success('Đã từ chối yêu cầu đóng.');
      setRefuseOpen(false);
      setRefuseReason('');
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setRefuseOpen(false);
        },
        onFields: (f) => {
          if (f.reason) {
            setRefuseError(f.reason);
            return true;
          }
        },
        fallbackMessage: 'Không từ chối được yêu cầu đóng.',
      });
    }
  }

  return (
    <>
      {/* Approve */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogTrigger asChild>
          <Button>Duyệt đóng</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt đóng yêu cầu</DialogTitle>
            <DialogDescription>
              Xác nhận công việc đã hoàn thành. Yêu cầu sẽ chuyển sang <strong>Hoàn tất</strong> và không thể mở lại.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="approve-note">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="approve-note"
              rows={3}
              placeholder="Ghi chú khi đóng (tuỳ chọn)…"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>
              Hủy
            </Button>
            <Button onClick={onApprove} disabled={approve.isPending}>
              {approve.isPending ? 'Đang duyệt…' : 'Duyệt đóng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refuse */}
      <Dialog open={refuseOpen} onOpenChange={setRefuseOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Từ chối</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu đóng</DialogTitle>
            <DialogDescription>
              Yêu cầu sẽ trở lại <strong>Đang xử lý</strong> để phòng ban làm lại. Nêu rõ lý do để họ biết cần bổ sung gì.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="refuse-reason">
              Lý do từ chối <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="refuse-reason"
              rows={3}
              placeholder="Ví dụ: chưa đính kèm ảnh nghiệm thu…"
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              aria-label="Lý do từ chối"
            />
            {refuseError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {refuseError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRefuseOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onRefuse} disabled={refuse.isPending}>
              {refuse.isPending ? 'Đang từ chối…' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}