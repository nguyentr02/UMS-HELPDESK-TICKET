import { UserDetail } from '@/components/admin/user-detail';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4 md:p-6">
      <UserDetail id={id} />
    </div>
  );
}
