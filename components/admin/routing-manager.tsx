'use client';

import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/lib/auth/session';
import { canManageRouting } from '@/lib/auth/rbac';
import {
  useCategories,
  useCreateRoutingRule,
  useDeleteRoutingRule,
  useDepartments,
  useRoutingRules,
} from '@/lib/queries/catalog';
import { handleMutationError } from '@/lib/api/errors';
import type { RoutingRule } from '@/lib/types/domain';
import { AccessDenied } from '@/components/ui/access-denied';
import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SELECT_CLASS =
  'rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/** S8 — Admin routing rules: category → department, with a default flag (drives Forward preselect). */
export function RoutingManager() {
  const role = useRole();
  const rules = useRoutingRules();
  const { data: categories } = useCategories();
  const { data: departments } = useDepartments();
  const createRule = useCreateRoutingRule();
  const deleteRule = useDeleteRoutingRule();

  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!canManageRouting(role)) return <AccessDenied />;

  const cats = categories ?? [];
  const depts = departments ?? [];
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? id;
  const deptName = (id: string) => depts.find((d) => d.id === id)?.name ?? id;

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !departmentId) {
      setError('Vui lòng chọn danh mục và phòng ban.');
      return;
    }
    setError(null);
    try {
      await createRule.mutateAsync({ categoryId, departmentId, isDefault });
      toast.success('Đã thêm quy tắc định tuyến.');
      setCategoryId('');
      setDepartmentId('');
      setIsDefault(true);
    } catch (err) {
      handleMutationError(err, {
        onFields: (f) => {
          const msg = f.categoryId ?? f.departmentId;
          if (msg) {
            setError(msg);
            return true;
          }
        },
        fallbackMessage: 'Không thêm được quy tắc.',
      });
    }
  }

  async function onDelete(rule: RoutingRule) {
    try {
      await deleteRule.mutateAsync(rule.id);
      toast.success('Đã xóa quy tắc.');
    } catch (err) {
      handleMutationError(err, { fallbackMessage: 'Không xóa được quy tắc.' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <form onSubmit={onAdd} className="flex h-fit flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-base font-medium">Thêm quy tắc</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rr-category">Danh mục</Label>
          <select
            id="rr-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Chọn danh mục —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rr-department">Phòng ban</Label>
          <select
            id="rr-department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Chọn phòng ban —</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={isDefault}
            onCheckedChange={(v) => setIsDefault(v === true)}
            aria-label="Đặt làm mặc định"
          />
          Đặt làm phòng ban mặc định
        </label>
        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={createRule.isPending}>
          {createRule.isPending ? 'Đang lưu…' : 'Thêm quy tắc'}
        </Button>
      </form>

      <DataState
        isLoading={rules.isLoading}
        isError={rules.isError}
        isEmpty={!rules.data || rules.data.length === 0}
        error="Không tải được quy tắc định tuyến. Vui lòng thử lại."
        empty={<EmptyState title="Chưa có quy tắc" description="Thêm quy tắc định tuyến đầu tiên." />}
      >
        {rules.data ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Danh mục</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Mặc định</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{catName(r.categoryId)}</TableCell>
                  <TableCell>{deptName(r.departmentId)}</TableCell>
                  <TableCell>
                    {r.isDefault ? (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Mặc định
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Xóa quy tắc ${catName(r.categoryId)}`}
                      disabled={deleteRule.isPending}
                      onClick={() => onDelete(r)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </DataState>
    </div>
  );
}
