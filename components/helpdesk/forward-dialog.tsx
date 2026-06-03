'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { useDepartments } from '@/lib/queries/catalog';
import { invalidateTicket, useForwardTicket } from '@/lib/queries/helpdesk';
import { handleMutationError } from '@/lib/api/errors';
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
import { Combobox } from '@/components/ui/combobox';

/** Forward to a phòng ban. No auto-preselect — Agent/Lead picks per ticket
 *  (routing rules were removed for being too rigid for cross-domain tickets). */
export function ForwardDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const { data: departments } = useDepartments();
  const forward = useForwardTicket(ticket.id);
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    if (!departmentId) {
      setError('Vui lòng chọn phòng ban');
      return;
    }
    setError(null);
    try {
      await forward.mutateAsync(departmentId);
      toast.success('Đã chuyển đến phòng ban.');
      setOpen(false);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          if (f.departmentId) {
            setError(f.departmentId);
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
        <Button variant="secondary">Chuyển phòng ban</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chuyển đến phòng ban</DialogTitle>
          <DialogDescription>Chọn phòng ban tiếp nhận xử lý yêu cầu.</DialogDescription>
        </DialogHeader>
        <Combobox
          label="Phòng ban"
          searchLabel="Tìm phòng ban"
          placeholder="Chọn phòng ban…"
          options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
          value={departmentId}
          onChange={(v) => {
            setDepartmentId(v);
            setError(null);
          }}
        />
        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={forward.isPending || !departmentId}>
            {forward.isPending ? 'Đang chuyển…' : 'Chuyển'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
