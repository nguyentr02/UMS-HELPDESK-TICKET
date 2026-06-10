import { UserEdit } from '@/components/admin/user-edit';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserEditPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-4 md:p-6">
      <UserEdit id={id} />
    </div>
  );
}
