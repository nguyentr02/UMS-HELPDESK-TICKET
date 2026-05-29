'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { useDepartments } from '@/lib/queries/catalog';
import { invalidateTicket, useRedirectTicket } from '@/lib/queries/helpdesk';
import { redirectSchema } from '@/lib/validation/schemas';
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
import { SearchableSelect } from '@/components/ui/searchable-select';

/** S5 — Redirect to another phòng ban with a reason; logged to history (from→to). */
export function RedirectDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const { data: departments } = useDepartments();
  const redirect = useRedirectTicket(ticket.id);
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onConfirm() {
    const parsed = redirectSchema.safeParse({ departmentId, reason });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      await redirect.mutateAsync({ departmentId, reason: parsed.data.reason });
      toast.success('Đã chuyển hướng phòng ban.');
      setOpen(false);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          setErrors(f);
          return true;
        },
        fallbackMessage: 'Không chuyển hướng được.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Chuyển hướng</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chuyển hướng phòng ban</DialogTitle>
          <DialogDescription>Định tuyến lại yêu cầu sang phòng ban khác kèm lý do.</DialogDescription>
        </DialogHeader>
        <div>
          <SearchableSelect
            label="Phòng ban mới"
            searchLabel="Tìm phòng ban"
            options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
            value={departmentId}
            onChange={(v) => {
              setDepartmentId(v);
              setErrors((e) => ({ ...e, departmentId: '' }));
            }}
          />
          {errors.departmentId ? (
            <p role="alert" className="mt-1 text-sm font-medium text-destructive">
              {errors.departmentId}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="redirect-reason">Lý do</Label>
          <Textarea
            id="redirect-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((er) => ({ ...er, reason: '' }));
            }}
          />
          {errors.reason ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.reason}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={redirect.isPending}>
            {redirect.isPending ? 'Đang chuyển hướng…' : 'Chuyển hướng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
