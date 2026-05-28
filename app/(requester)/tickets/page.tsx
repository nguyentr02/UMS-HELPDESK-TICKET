import { TicketList } from '@/components/tickets/ticket-list';

export default function MyTicketsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Yêu cầu của tôi</h1>
      <TicketList />
    </div>
  );
}
