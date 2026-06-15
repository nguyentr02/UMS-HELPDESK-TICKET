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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { handleMutationError } from '@/lib/api/errors';
import { useCategories } from '@/lib/queries/catalog';
import { invalidateTicket, useAssignCategory } from '@/lib/queries/helpdesk';
import type { Ticket } from '@/lib/types/domain';

// Radix Select forbids empty-string item values; this sentinel maps to "no category".
const NO_CATEGORY = '__none__';

/** Helpdesk (Lead + Agent) re-categorises a ticket. Quiet update — no event,
 *  no notifications. Picking "— Không phân loại —" clears the category. */
export function CategoryAssignDialog({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const { data: categories } = useCategories();
  const assign = useAssignCategory(ticket.id);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(ticket.category?.id ?? '');

  async function onConfirm() {
    const next = categoryId || null;
    if (next === (ticket.category?.id ?? null)) {
      setOpen(false);
      return;
    }
    try {
      await assign.mutateAsync(next);
      toast.success(next ? 'Đã cập nhật danh mục.' : 'Đã bỏ phân loại.');
      setOpen(false);
    } catch (err) {
      handleMutationError(err, {
        onConflict: () => {
          invalidateTicket(qc, ticket.id);
          setOpen(false);
        },
        onFields: (f) => {
          if (f.categoryId) {
            toast.error(f.categoryId);
            return true;
          }
        },
        fallbackMessage: 'Không cập nhật được danh mục.',
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        // Reset the local pick to the ticket's current category every time the
        // dialog re-opens so a previous unsaved selection doesn't linger.
        if (o) setCategoryId(ticket.category?.id ?? '');
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">Phân loại</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phân loại ticket</DialogTitle>
          <DialogDescription>
            Chọn danh mục phù hợp. Bỏ chọn để đưa ticket về trạng thái chưa phân loại.
          </DialogDescription>
        </DialogHeader>
        <Select
          value={categoryId ? categoryId : NO_CATEGORY}
          onValueChange={(v) => setCategoryId(v === NO_CATEGORY ? '' : v)}
        >
          <SelectTrigger aria-label="Danh mục">
            <SelectValue placeholder="— Chọn danh mục —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY}>— Không phân loại —</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={assign.isPending}>
            {assign.isPending ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
