'use client';

import { Trash2 } from 'lucide-react';
import { type FormEvent,useState } from 'react';
import { toast } from 'sonner';

import { AccessDenied } from '@/components/ui/access-denied';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleMutationError } from '@/lib/api/errors';
import { canManageCategories } from '@/lib/auth/rbac';
import { useRole } from '@/lib/auth/session';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/lib/queries/catalog';
import type { Category } from '@/lib/types/domain';
import { categorySchema } from '@/lib/validation/schemas';

function CategoryRow({
  cat,
  pending,
  onDelete,
}: {
  cat: Category;
  pending: boolean;
  onDelete: (c: Category) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
      <span className="flex items-center gap-2">
        <span className="font-medium">{cat.name}</span>
        {!cat.isActive ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Ẩn</span>
        ) : null}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Xóa ${cat.name}`}
        title="Xóa danh mục"
        disabled={pending}
        onClick={() => onDelete(cat)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

/** S8 — Admin category list: flat (no parent), add + delete. */
export function CategoryManager() {
  const role = useRole();
  const { data, isLoading, isError } = useCategories();
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  // Holds the row the admin clicked Trash on — the actual DELETE only fires
  // when they confirm in the dialog. `null` keeps the dialog closed.
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  if (!canManageCategories(role)) return <AccessDenied />;

  const cats = data ?? [];

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = categorySchema.safeParse({ name });
    if (!parsed.success) {
      setNameError(
        parsed.error.issues.find((i) => i.path[0] === 'name')?.message ?? 'Dữ liệu không hợp lệ',
      );
      return;
    }
    setNameError(null);
    try {
      await createCat.mutateAsync({ name: parsed.data.name });
      toast.success('Đã thêm danh mục.');
      setName('');
    } catch (err) {
      handleMutationError(err, {
        onFields: (f) => {
          if (f.name) {
            setNameError(f.name);
            return true;
          }
        },
        fallbackMessage: 'Không thêm được danh mục.',
      });
    }
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteCat.mutateAsync(pendingDelete.id);
      toast.success('Đã xóa danh mục.');
      setPendingDelete(null);
    } catch (err) {
      handleMutationError(err, { fallbackMessage: 'Không xóa được danh mục.' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Thêm danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Tên danh mục</Label>
              <Input
                id="cat-name"
                placeholder="VD: Thiết bị mạng"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!nameError}
              />
              {nameError ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {nameError}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={createCat.isPending}>
              {createCat.isPending ? 'Đang lưu…' : 'Thêm danh mục'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={cats.length === 0}
        error="Không tải được danh mục. Vui lòng thử lại."
        empty={<EmptyState title="Chưa có danh mục" description="Hãy thêm danh mục đầu tiên." />}
      >
        <ul aria-label="Danh sách danh mục" className="flex flex-col gap-2">
          {cats.map((cat) => (
            <li key={cat.id}>
              <CategoryRow
                cat={cat}
                pending={deleteCat.isPending}
                onDelete={setPendingDelete}
              />
            </li>
          ))}
        </ul>
      </DataState>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá danh mục?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  Việc xoá <span className="font-semibold">“{pendingDelete.name}”</span> sẽ
                  gỡ danh mục khỏi <span className="font-semibold">mọi yêu cầu</span> đang
                  gắn danh mục này — các ticket đó sẽ trở về trạng thái{' '}
                  <span className="font-semibold">chưa phân loại</span>. Hành động không
                  thể hoàn tác.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleteCat.isPending}
            >
              Không
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={deleteCat.isPending}
            >
              {deleteCat.isPending ? 'Đang xoá…' : 'Có, xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
