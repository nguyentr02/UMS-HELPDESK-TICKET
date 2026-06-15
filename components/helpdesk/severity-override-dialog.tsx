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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { handleMutationError } from '@/lib/api/errors';
import { invalidateTicket, useOverrideSeverity } from '@/lib/queries/helpdesk';
import { SEVERITY_META } from '@/lib/status/severity';
import type { Severity, Ticket } from '@/lib/types/domain';
import { SEVERITIES } from '@/lib/validation/schemas';

/** Helpdesk overrides a mis-declared severity (Brief §5; TICKET_MOD). */
export function SeverityOverrideDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const override = useOverrideSeverity(ticket.id);
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState<Severity>(ticket.severity);

  async function onConfirm() {
    if (severity === ticket.severity) {
      setOpen(false);
      return;
    }
    try {
      await override.mutateAsync(severity);
      toast.success('Đã điều chỉnh mức độ.');
      setOpen(false);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        fallbackMessage: 'Không điều chỉnh được mức độ.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Điều chỉnh mức độ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Điều chỉnh mức độ</DialogTitle>
          <DialogDescription>Cập nhật mức độ ưu tiên nếu người gửi khai báo chưa đúng.</DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={severity}
          onValueChange={(v) => setSeverity(v as Severity)}
          className="flex flex-col gap-2"
        >
          {SEVERITIES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <RadioGroupItem value={s} id={`ovr-${s}`} />
              <Label htmlFor={`ovr-${s}`} className="flex items-center gap-1 font-normal">
                <span aria-hidden>{SEVERITY_META[s].emoji}</span>
                {SEVERITY_META[s].label} — {SEVERITY_META[s].viLabel}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={override.isPending}>
            {override.isPending ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
