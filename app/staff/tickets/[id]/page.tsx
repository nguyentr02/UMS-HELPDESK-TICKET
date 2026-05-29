import { StaffTicketDetail } from '@/components/staff/staff-ticket-detail';

export default function StaffTicketPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <StaffTicketDetail id={params.id} />
    </div>
  );
}
