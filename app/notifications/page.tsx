import { ClearAllButton } from '@/components/notifications/clear-all-button';
import { MarkAllReadButton } from '@/components/notifications/mark-all-read-button';
import { NotificationList } from '@/components/notifications/notification-list';

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Thông báo</h1>
        <div className="flex items-center gap-2">
          <MarkAllReadButton />
          <ClearAllButton />
        </div>
      </div>
      <NotificationList />
    </div>
  );
}
