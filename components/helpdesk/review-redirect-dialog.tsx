'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Ticket } from '@/lib/types/domain';
import { useDepartments } from '@/lib/queries/catalog';
import { invalidateTicket, useApproveRedirect, useRefuseRedirect } from '@/lib/queries/helpdesk';
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
 * S19 — the owning Agent/Lead reviews a DeptStaff redirect request (reason in
 * the timeline). Approve → pick the destination dept (→ Assigned, new dept);
 * Refuse → reason required (→ back to the prior status).
 */
export function ReviewRedirectDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const { data: departments } = useDepartments();
  const approve = useApproveRedirect(ticket.id);
  const refuse = useRefuseRedirect(ticket.id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [note, setNote] = useState('');
  const [approveError, setApproveError] = useState<string | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [refuseError, setRefuseError] = useState<string | undefined>(undefined);

  const options = (departments ?? [])
    .filter((d) => d.id !== ticket.routedDepartment?.id)
    .map((d) => ({ value: d.id, label: d.name }));

  async function onApprove() {
    if (!departmentId) {
      setApproveError('Vui lòng chọn phòng ban');
      return;
    }
    setApproveError(null);
    try {
      await approve.mutateAsync({ departmentId, note: note.trim() || undefined });
      toast.success('Đã duyệt chuyển phòng ban.');
      setApproveOpen(false);
      setDepartmentId('');
      setNote('');
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setApproveOpen(false);
        },
        onFields: (f) => {
          if (f.departmentId) {
            setApproveError(f.departmentId);
            return true;
          }
        },
        fallbackMessage: 'Không duyệt được yêu cầu chuyển.',
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
      toast.success('Đã từ chối yêu cầu chuyển.');
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
        fallbackMessage: 'Không từ chối được yêu cầu chuyển.',
      });
    }
  }

  return (
    <>
      {/* Approve — pick the destination dept */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogTrigger asChild>
          <Button>Duyệt chuyển</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu chuyển phòng ban</DialogTitle>
            <DialogDescription>
              Chọn phòng ban tiếp nhận. Yêu cầu sẽ chuyển sang phòng mới và về trạng thái{' '}
              <strong>Đã giao phòng ban</strong>.
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
              setApproveError(null);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="approve-redirect-note">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="approve-redirect-note"
              rows={2}
              placeholder="Ghi chú khi chuyển (tuỳ chọn)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {approveError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {approveError}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>
              Hủy
            </Button>
            <Button onClick={onApprove} disabled={approve.isPending || !departmentId}>
              {approve.isPending ? 'Đang duyệt…' : 'Duyệt chuyển'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refuse — reason required */}
      <Dialog open={refuseOpen} onOpenChange={setRefuseOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Từ chối</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu chuyển</DialogTitle>
            <DialogDescription>
              Yêu cầu sẽ trở lại trạng thái trước đó để phòng ban tiếp tục xử lý. Nêu rõ lý do.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="refuse-redirect-reason">
              Lý do từ chối <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="refuse-redirect-reason"
              rows={3}
              placeholder="Ví dụ: ticket đúng phòng bạn, vui lòng xử lý…"
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              aria-label="Lý do từ chối chuyển"
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