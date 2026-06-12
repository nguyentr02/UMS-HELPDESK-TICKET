'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { useDepartments } from '@/lib/queries/catalog';
import { invalidateTicket, useRedirectTicket } from '@/lib/queries/helpdesk';
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
import { Combobox } from '@/components/ui/combobox';

/**
 * S18 — Agent/Lead re-routes an already-assigned ticket to a different
 * department, with a reason. The current dept is excluded from the picker;
 * the new dept starts fresh (Assigned) while the Helpdesk assignee is kept.
 */
export function RedirectDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const { data: departments } = useDepartments();
  const redirect = useRedirectTicket(ticket.id);
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Don't offer the dept the ticket is already in.
  const options = (departments ?? [])
    .filter((d) => d.id !== ticket.routedDepartment?.id)
    .map((d) => ({ value: d.id, label: d.name }));

  async function onConfirm() {
    if (!departmentId) {
      setError('Vui lòng chọn phòng ban');
      return;
    }
    if (reason.trim().length < 1) {
      setError('Vui lòng nhập lý do chuyển');
      return;
    }
    setError(null);
    try {
      await redirect.mutateAsync({ departmentId, reason: reason.trim() });
      toast.success('Đã chuyển sang phòng ban khác.');
      setOpen(false);
      setDepartmentId('');
      setReason('');
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          if (f.departmentId || f.reason) {
            setError(f.departmentId ?? f.reason);
            return true;
          }
        },
        fallbackMessage: 'Không chuyển được phòng ban.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Chuyển phòng khác</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chuyển sang phòng ban khác</DialogTitle>
          <DialogDescription>
            Yêu cầu sẽ chuyển sang phòng ban mới và quay về trạng thái <strong>Đã giao phòng ban</strong>.
          </DialogDescription>
        </DialogHeader>
        <Combobox
          label="Phòng ban mới"
          searchLabel="Tìm phòng ban"
          placeholder="Chọn phòng ban…"
          options={options}
          value={departmentId}
          onChange={(v) => {
            setDepartmentId(v);
            setError(null);
          }}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="redirect-reason">
            Lý do <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="redirect-reason"
            rows={3}
            placeholder="Vì sao chuyển sang phòng ban này…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Lý do chuyển phòng ban"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={redirect.isPending || !departmentId}>
            {redirect.isPending ? 'Đang chuyển…' : 'Chuyển'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}