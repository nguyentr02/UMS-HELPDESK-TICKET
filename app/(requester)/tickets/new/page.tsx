import { CreateTicketGuide } from '@/components/tickets/create-ticket-guide';
import { TicketForm } from '@/components/tickets/ticket-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewTicketPage() {
  return (
    <div className="p-4 md:p-6">
      {/* Responsive: stacked on mobile (form first, then guide); two columns at lg+. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Tạo yêu cầu hỗ trợ</CardTitle>
            <CardDescription>Gửi yêu cầu hỗ trợ đến Helpdesk.</CardDescription>
          </CardHeader>
          <CardContent>
            <TicketForm />
          </CardContent>
        </Card>
        <aside>
          <CreateTicketGuide />
        </aside>
      </div>
    </div>
  );
}
