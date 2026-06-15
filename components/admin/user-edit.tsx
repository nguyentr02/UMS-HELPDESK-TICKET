'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { AccessDenied } from '@/components/ui/access-denied';
import { DataState } from '@/components/ui/data-state';
import { EmptyState } from '@/components/ui/empty-state';
import { canUpdateUsers } from '@/lib/auth/rbac';
import { useRole } from '@/lib/auth/session';
import { useUser } from '@/lib/queries/users';

import { UserEditForm } from './user-edit-form';

/**
 * Edit shell: Admin-gate → fetch the user → render the form with the existing
 * record as initial values. 404 from the BE renders the same empty-state copy
 * the detail page uses so callers can deep-link a stale id without crashing.
 */
export function UserEdit({ id }: { id: string }) {
  const role = useRole();
  const { data, isLoading, isError } = useUser(id);

  if (!canUpdateUsers(role)) return <AccessDenied />;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5" aria-label="Cập nhật người dùng">
      <div>
        <Link
          href={`/admin/users/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Quay lại chi tiết
        </Link>
      </div>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cập nhật người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Chỉnh sửa họ tên, vai trò, phòng ban, hoặc đặt lại mật khẩu. Email không sửa được tại đây.
        </p>
      </header>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        empty={<EmptyState title="Không tìm thấy người dùng" description="Người dùng này có thể đã bị xóa." />}
      >
        {data ? <UserEditForm user={data} /> : null}
      </DataState>
    </section>
  );
}
