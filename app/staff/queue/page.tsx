import { StaffQueue } from '@/components/staff/staff-queue';

export default function StaffQueuePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Hàng đợi phòng ban</h1>
      <StaffQueue />
    </div>
  );
}
