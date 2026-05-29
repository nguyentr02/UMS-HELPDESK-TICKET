import { Dashboard } from '@/components/analytics/dashboard';

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Báo cáo</h1>
      <Dashboard />
    </div>
  );
}
