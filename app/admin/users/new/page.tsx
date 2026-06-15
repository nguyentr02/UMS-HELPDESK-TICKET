'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { UserCreateForm } from '@/components/admin/user-create-form';
import { AccessDenied } from '@/components/ui/access-denied';
import { canCreateUsers } from '@/lib/auth/rbac';
import { useRole } from '@/lib/auth/session';

export default function AdminUserCreatePage() {
  const role = useRole();
  if (!canCreateUsers(role)) return <AccessDenied />;

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Quay lại danh sách
          </Link>
        </div>
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Tạo người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản mới sẽ dùng được ngay với mật khẩu (hoặc chỉ Google SSO nếu để trống).
          </p>
        </header>
        <UserCreateForm />
      </section>
    </div>
  );
}
