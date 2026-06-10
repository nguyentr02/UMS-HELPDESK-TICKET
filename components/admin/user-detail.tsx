'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRole, useSession } from '@/lib/auth/session';
import { canDeleteUsers, canUpdateUsers, canViewUsers } from '@/lib/auth/rbac';
import { ROLE_VI } from '@/lib/auth/nav';
import { useDeactivateUser, useUser } from '@/lib/queries/users';
import { ApiError } from '@/lib/api/client';
import { handleMutationError } from '@/lib/api/errors';
import { AccessDenied } from '@/components/ui/access-denied';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Admin per-user detail page. Shows the bare-minimum identity / role / dept
 * fields the BE exposes (sensitive fields like `passwordHash`, `ssoSubject`,
 * `googleId` are projected out server-side).
 *
 * The action buttons (Cập nhật / Xóa người dùng) are gated by the matching
 * RBAC predicates AND a self-target guard for delete — an Admin must not be
 * able to deactivate themselves and lock the system out.
 */
export function UserDetail({ id }: { id: string }) {
  const role = useRole();
  const session = useSession();
  const router = useRouter();
  const { data: user, isLoading, error } = useUser(id);
  const deactivate = useDeactivateUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!canViewUsers(role)) return <AccessDenied />;

  const isSelf = !!user && user.id === session.user.id;

  async function handleConfirmDelete() {
    if (!user) return;
    try {
      await deactivate.mutateAsync(user.id);
      toast.success(`Đã xóa ${user.displayName}`);
      setConfirmOpen(false);
      router.push('/admin/users');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(err.message || 'Không thể xóa người dùng này.');
        setConfirmOpen(false);
        return;
      }
      handleMutationError(err, {
        onUnauthorized: () => router.push('/login'),
        fallbackMessage: 'Không xóa được người dùng, vui lòng thử lại.',
      });
    }
  }

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
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold">{user.displayName}</h1>
              <p className="font-mono text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canUpdateUsers(role) ? (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/admin/users/${user.id}/edit`} aria-label="Cập nhật người dùng">
                    <Pencil className="h-4 w-4" aria-hidden />
                    Cập nhật
                  </Link>
                </Button>
              ) : null}
              {canDeleteUsers(role) ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isSelf || deactivate.isPending}
                  // BE also enforces this with a 409 — the UI just makes it
                  // impossible to even attempt, so the admin doesn't see an
                  // alarming "Conflict" toast for an action that was never valid.
                  title={isSelf ? 'Không thể tự xóa tài khoản của bạn' : undefined}
                  aria-label="Xóa người dùng"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Xóa
                </Button>
              ) : null}
            </div>
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

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xóa người dùng?</DialogTitle>
                <DialogDescription>
                  Tài khoản <strong>{user.displayName}</strong> ({user.email}) sẽ bị vô hiệu hóa và không thể đăng nhập.
                  Lịch sử yêu cầu / bình luận của họ vẫn được giữ lại. Bạn có thể kích hoạt lại từ module M1 (IAM).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deactivate.isPending}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deactivate.isPending}
                >
                  {deactivate.isPending ? 'Đang xóa…' : 'Xóa người dùng'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
