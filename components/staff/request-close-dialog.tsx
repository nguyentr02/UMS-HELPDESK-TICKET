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
import { FileUpload } from '@/components/ui/file-upload';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { handleMutationError } from '@/lib/api/errors';
import { invalidateTicket, useRequestClose } from '@/lib/queries/helpdesk';
import type { Ticket } from '@/lib/types/domain';

/**
 * S17 — DeptStaff submits a close request with proof: a comment (required)
 * describing the work done + optional images. Status → CloseRequested; the
 * owning Agent/Lead approves or refuses.
 */
export function RequestCloseDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const requestClose = useRequestClose(ticket.id);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);

  async function onConfirm() {
    if (note.trim().length < 1) {
      setError('Cần mô tả công việc đã hoàn thành');
      return;
    }
    setError(undefined);
    const fd = new FormData();
    fd.set('note', note.trim());
    for (const f of files) fd.append('files', f);
    try {
      await requestClose.mutateAsync(fd);
      toast.success('Đã gửi yêu cầu đóng. Chờ Helpdesk duyệt.');
      setOpen(false);
      setNote('');
      setFiles([]);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          if (f.note) {
            setError(f.note);
            return true;
          }
        },
        fallbackMessage: 'Không gửi được yêu cầu đóng.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yêu cầu đóng</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yêu cầu đóng yêu cầu</DialogTitle>
          <DialogDescription>
            Mô tả công việc đã hoàn thành (kèm ảnh nếu có) để Helpdesk duyệt. Yêu cầu sẽ chuyển sang{' '}
            <strong>Chờ duyệt đóng</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="request-close-note">
              Mô tả công việc <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="request-close-note"
              rows={3}
              placeholder="Đã hoàn thành những gì, kết quả nghiệm thu…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Mô tả công việc đã hoàn thành"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Ảnh minh chứng (tuỳ chọn)</Label>
            <FileUpload files={files} onChange={setFiles} />
          </div>
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
          <Button onClick={onConfirm} disabled={requestClose.isPending}>
            {requestClose.isPending ? 'Đang gửi…' : 'Gửi yêu cầu đóng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}