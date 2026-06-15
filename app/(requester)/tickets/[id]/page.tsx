import { RelatedTickets } from '@/components/tickets/related-tickets';
import { TicketDetail } from '@/components/tickets/ticket-detail';

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 md:p-8">
      {/* Responsive: stacked on mobile (detail, then related); two columns at lg+. */}
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TicketDetail id={params.id} />
        <aside>
          <RelatedTickets currentId={params.id} />
        </aside>
      </div>
    </div>
  );
}