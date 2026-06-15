import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 border-dashed bg-transparent p-8 text-center shadow-none">
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </Card>
  );
}
