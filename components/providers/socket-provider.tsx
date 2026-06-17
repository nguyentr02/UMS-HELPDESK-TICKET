'use client';

import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { fetchRealtimeToken } from '@/lib/api/auth';
import { useSessionOptional } from '@/lib/auth/session';
import { NOTIFICATION_TYPE_LABEL, notificationMessage } from '@/lib/notifications/labels';
import { analyticsKeys } from '@/lib/queries/analytics';
import { catalogKeys } from '@/lib/queries/catalog';
import { notificationKeys } from '@/lib/queries/notifications';
import { ticketKeys } from '@/lib/queries/tickets';
import { prependNotification } from '@/lib/realtime/notifications-cache';
import type { NotificationItem } from '@/lib/types/domain';

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;

/**
 * Live notification bridge. When a user is signed in and NEXT_PUBLIC_REALTIME_URL
 * is set, opens a Socket.IO connection (authenticated with a short-lived token
 * from the BE) and:
 *   - on `notification:new` → optimistically prepend to the notifications cache
 *     (instant badge bump) + toast;
 *   - on every (re)connect → invalidate the cache to reconcile anything missed
 *     while disconnected;
 *   - on `connect_error` (e.g. the 60 s token expired before a reconnect) →
 *     fetch a fresh token so the next retry succeeds.
 * The 30 s poll in `useNotifications` remains the fallback. No-op (just renders
 * children) when realtime is unconfigured or the user is logged out.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const session = useSessionOptional();
  const userId = session?.user?.id ?? null;
  const qc = useQueryClient();

  useEffect(() => {
    if (!REALTIME_URL || !userId) return;

    let socket: Socket | null = null;
    let cancelled = false;

    void (async () => {
      let token: string;
      try {
        token = (await fetchRealtimeToken()).token;
      } catch {
        return; // no token (e.g. transient 401) → rely on the poll
      }
      if (cancelled) return;

      socket = io(REALTIME_URL, { auth: { token } });

      socket.on('notification:new', (n: NotificationItem) => {
        qc.setQueryData<NotificationItem[]>(notificationKeys.all, (old) =>
          prependNotification(old, n),
        );
        // A notification means this ticket changed for me → refresh the open
        // detail/comments/history live (key prefix matches all three). This is
        // the "see the new comment without reloading" path.
        if (n.ticketId) {
          void qc.invalidateQueries({ queryKey: ticketKeys.detail(n.ticketId) });
        }
        const code = typeof n.payload?.ticketCode === 'string' ? n.payload.ticketCode : '';
        toast(NOTIFICATION_TYPE_LABEL[n.type] ?? 'Thông báo mới', {
          description: notificationMessage(n.type, code) || undefined,
        });
      });

      // Reference data changed (admin edited a category) → refetch live so every
      // client's filters/forms update without a reload.
      socket.on('categories:changed', () => {
        void qc.invalidateQueries({ queryKey: catalogKeys.categories });
      });

      // Any ticket was created/changed (by anyone) → refetch open queues/lists
      // and the dashboard counts live, so they don't wait for a reload/poll.
      socket.on('tickets:changed', () => {
        void qc.invalidateQueries({ queryKey: ticketKeys.all });
        void qc.invalidateQueries({ queryKey: analyticsKeys.summary });
      });

      // Reconcile on (re)connect — covers events missed while disconnected.
      socket.on('connect', () => {
        void qc.invalidateQueries({ queryKey: notificationKeys.all });
      });

      // The handshake token is short-lived; on a later reconnect it may have
      // expired. Refresh it so socket.io's next retry authenticates.
      socket.on('connect_error', async () => {
        if (cancelled || !socket) return;
        try {
          const fresh = await fetchRealtimeToken();
          socket.auth = { token: fresh.token };
        } catch {
          /* logged out / offline — socket.io keeps retrying with backoff */
        }
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [userId, qc]);

  return <>{children}</>;
}