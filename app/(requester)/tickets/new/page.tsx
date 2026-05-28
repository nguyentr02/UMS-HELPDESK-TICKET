import { TicketForm } from '@/components/tickets/ticket-form';
import { CreateTicketGuide } from '@/components/tickets/create-ticket-guide';

export default function NewTicketPage() {
  return (
    <div className="p-4 md:p-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold">Tạo yêu cầu hỗ trợ</h1>
        <p className="text-sm text-muted-foreground">Gửi yêu cầu hỗ trợ đến Helpdesk.</p>
      </header>

      {/* Responsive: stacked on mobile (form first, then guide); two columns at lg+. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <TicketForm />
        <aside>
          <CreateTicketGuide />
        </aside>
      </div>
    </div>
  );
}
