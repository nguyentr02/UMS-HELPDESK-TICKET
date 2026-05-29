import { HelpdeskTicketDetail } from '@/components/helpdesk/helpdesk-ticket-detail';

export default function HelpdeskTicketPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <HelpdeskTicketDetail id={params.id} />
    </div>
  );
}
