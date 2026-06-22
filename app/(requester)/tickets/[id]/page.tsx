import { RelatedTickets } from '@/components/tickets/related-tickets';
import { TicketDetail } from '@/components/tickets/ticket-detail';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-4 md:p-8">
      {/* Responsive: stacked on mobile (detail, then related); two columns at lg+. */}
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TicketDetail id={id} />
        <aside>
          <RelatedTickets currentId={id} />
        </aside>
      </div>
    </div>
  );
}