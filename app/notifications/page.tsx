import { NotificationList } from '@/components/notifications/notification-list';

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Thông báo</h1>
      <NotificationList />
    </div>
  );
}
