import { HelpdeskQueue } from '@/components/helpdesk/helpdesk-queue';

export default function HelpdeskQueuePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Hàng đợi Helpdesk</h1>
      <HelpdeskQueue />
    </div>
  );
}
