import { StaffTicketDetail } from '@/components/staff/staff-ticket-detail';

export default async function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <StaffTicketDetail id={id} />
    </div>
  );
}
