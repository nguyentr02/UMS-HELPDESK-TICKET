'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTickets } from '@/lib/queries/tickets';

/** Side panel on the ticket detail — the user's other open (non-finished) tickets. */
export function RelatedTickets({ currentId }: { currentId: string }) {
  const { data, isLoading, isError } = useTickets({
    status: 'open',
    pageSize: 50,
    sort: '-createdAt',
  });
  const others = (data?.items ?? []).filter((t) => t.id !== currentId);

  return (
    <Card className="border-t-4 border-t-red-600 shadow-md">
      <CardHeader>
        <CardTitle className="text-base text-red-700">Yêu cầu khác của bạn</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">
            Không tải được danh sách.
          </p>
        ) : others.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không còn yêu cầu nào khác.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {others.map((t) => (
              <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                <Link href={`/tickets/${t.id}`} className="group flex flex-col gap-1.5">
                  <span className="line-clamp-1 text-sm font-medium group-hover:underline">
                    {t.title}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={t.severity} />
                    <StatusBadge status={t.externalStatus} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
