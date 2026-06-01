import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** A single headline metric for the dashboard. */
export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums truncate" title={String(value)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
