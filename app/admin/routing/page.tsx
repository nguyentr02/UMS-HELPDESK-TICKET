import { RoutingManager } from '@/components/admin/routing-manager';

export default function AdminRoutingPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Định tuyến</h1>
      <RoutingManager />
    </div>
  );
}
