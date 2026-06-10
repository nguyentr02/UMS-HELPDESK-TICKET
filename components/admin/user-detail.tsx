'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRole } from '@/lib/auth/session';
import { canViewUsers } from '@/lib/auth/rbac';
import { ROLE_VI } from '@/lib/auth/nav';
import { useUser } from '@/lib/queries/users';
import { ApiError } from '@/lib/api/client';
import { AccessDenied } from '@/components/ui/access-denied';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Admin per-user detail page. Read-only. Shows the bare-minimum identity +
 * role + department fields the BE exposes (sensitive fields like
 * `passwordHash`, `ssoSubject`, `googleId` are projected out server-side).
 */
export function UserDetail({ id }: { id: string }) {
  const role = useRole();
  const { data: user, isLoading, error } = useUser(id);

  if (!canViewUsers(role)) return <AccessDenied />;

  return (
    <section className="flex flex-col gap-5" aria-label="Chi tiết người dùng">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Danh sách người dùng
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error instanceof ApiError && error.status === 404
            ? 'Không tìm thấy người dùng.'
            : 'Đã xảy ra lỗi khi tải thông tin người dùng.'}
        </p>
      ) : user ? (
        <>
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{user.displayName}</h1>
            <p className="font-mono text-sm text-muted-foreground">{user.email}</p>
          </header>

          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="ID" value={user.id} mono />
              <Field label="Vai trò" value={<Badge variant="secondary">{ROLE_VI[user.role]}</Badge>} />
              <Field label="Phòng ban" value={user.department?.name ?? '—'} />
              <Field
                label="Mã phòng ban"
                value={user.department?.code ?? '—'}
                mono={!!user.department}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</span>
    </div>
  );
}
