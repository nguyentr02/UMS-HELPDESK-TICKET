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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROOT = '__root__'; // Radix Select forbids empty-string item values.

function CategoryRow({
  cat,
  hasChildren,
  pending,
  onDelete,
}: {
  cat: Category;
  hasChildren: boolean;
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
        title={hasChildren ? 'Không thể xóa danh mục đang có danh mục con' : 'Xóa danh mục'}
        disabled={hasChildren || pending}
        onClick={() => onDelete(cat)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

/** S8 — Admin category tree: add (optionally under a parent) + delete (guarded). */
export function CategoryManager() {
  const role = useRole();
  const { data, isLoading, isError } = useCategories();
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  if (!canManageCategories(role)) return <AccessDenied />;

  const cats = data ?? [];
  const roots = cats.filter((c) => !c.parentId);
  const childrenOf = (id: string) => cats.filter((c) => c.parentId === id);
  const hasChildren = (id: string) => cats.some((c) => c.parentId === id);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = categorySchema.safeParse({ name, parentId: parentId || null });
    if (!parsed.success) {
      setNameError(parsed.error.issues.find((i) => i.path[0] === 'name')?.message ?? 'Dữ liệu không hợp lệ');
      return;
    }
    setNameError(null);
    try {
      await createCat.mutateAsync({ name: parsed.data.name, parentId: parsed.data.parentId ?? null });
      toast.success('Đã thêm danh mục.');
      setName('');
      setParentId('');
    } catch (err) {
      handleMutationError(err, {
        onFields: (f) => {
          const msg = f.name ?? f.parentId;
          if (msg) {
            setNameError(msg);
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat-parent">Danh mục cha (tuỳ chọn)</Label>
          <Select value={parentId || ROOT} onValueChange={(v) => setParentId(v === ROOT ? '' : v)}>
            <SelectTrigger id="cat-parent" aria-label="Danh mục cha">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROOT}>— Không có (cấp gốc) —</SelectItem>
              {roots.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <ul aria-label="Cây danh mục" className="flex flex-col gap-2">
          {roots.map((root) => (
            <li key={root.id}>
              <CategoryRow
                cat={root}
                hasChildren={hasChildren(root.id)}
                pending={deleteCat.isPending}
                onDelete={onDelete}
              />
              {childrenOf(root.id).length ? (
                <ul className="ml-5 mt-2 flex flex-col gap-2 border-l border-border pl-4">
                  {childrenOf(root.id).map((child) => (
                    <li key={child.id}>
                      <CategoryRow
                        cat={child}
                        hasChildren={false}
                        pending={deleteCat.isPending}
                        onDelete={onDelete}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}
