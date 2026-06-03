'use client';

import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/lib/auth/session';
import { canManageCategories } from '@/lib/auth/rbac';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/lib/queries/catalog';
import { categorySchema } from '@/lib/validation/schemas';
import { handleMutationError } from '@/lib/api/errors';
import type { Category } from '@/lib/types/domain';
import { AccessDenied } from '@/components/ui/access-denied';
import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  async function onDelete(cat: Category) {
    try {
      await deleteCat.mutateAsync(cat.id);
      toast.success('Đã xóa danh mục.');
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
              <CategoryRow cat={cat} pending={deleteCat.isPending} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}
