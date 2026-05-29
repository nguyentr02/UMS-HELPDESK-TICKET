'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { useAgents } from '@/lib/queries/catalog';
import { invalidateTicket, useAssignAgent } from '@/lib/queries/helpdesk';
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

/** S3 — Helpdesk Lead assigns/reassigns the owning agent (no status change). */
export function AssignDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const { data: agents } = useAgents();
  const assign = useAssignAgent(ticket.id);
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState(ticket.helpdeskAssignee?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    if (!agentId) {
      setError('Vui lòng chọn nhân viên Helpdesk');
      return;
    }
    setError(null);
    try {
      await assign.mutateAsync(agentId);
      toast.success('Đã gán nhân viên Helpdesk.');
      setOpen(false);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          if (f.agentId) {
            setError(f.agentId);
            return true;
          }
        },
        fallbackMessage: 'Không gán được nhân viên.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Gán nhân viên</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gán nhân viên Helpdesk</DialogTitle>
          <DialogDescription>Chọn nhân viên Helpdesk phụ trách yêu cầu này.</DialogDescription>
        </DialogHeader>
        <Combobox
          label="Nhân viên Helpdesk"
          searchLabel="Tìm nhân viên"
          placeholder="Chọn nhân viên…"
          options={(agents ?? []).map((a) => ({ value: a.id, label: a.displayName }))}
          value={agentId}
          onChange={(v) => {
            setAgentId(v);
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
          <Button onClick={onConfirm} disabled={assign.isPending || !agentId}>
            {assign.isPending ? 'Đang gán…' : 'Gán'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
