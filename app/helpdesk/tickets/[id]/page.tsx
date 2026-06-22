import { HelpdeskTicketDetail } from '@/components/helpdesk/helpdesk-ticket-detail';

export default async function HelpdeskTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <HelpdeskTicketDetail id={id} />
    </div>
  );
}
