'use client';

import { type ReactNode,useEffect, useState } from 'react';

const SW_RELOAD_KEY = '__msw_reload_once';

/** `true` only when `NEXT_PUBLIC_USE_MOCKS=true`; any other value (including
 *  `'false'`, `''`, or missing) routes calls to the real BE. */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

/**
 * Starts the MSW browser worker before rendering children when
 * `NEXT_PUBLIC_USE_MOCKS=true`. When mocks are off, this is a transparent
 * pass-through so `apiFetch` reaches the real backend at `NEXT_PUBLIC_API_BASE_URL`.
 *
 * Mock-mode robustness fixes (only relevant when USE_MOCKS=true):
 *  - `onUnhandledRequest: 'warn'` surfaces URLs MSW doesn't know about in the
 *    console instead of silently falling through to the dev server.
 *  - On first registration the current page isn't under SW control yet, so
 *    early requests would bypass to the network. Reload once (sessionStorage-
 *    gated) so the SW takes control.
 */
export function MswReady({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!USE_MOCKS);

  useEffect(() => {
    if (!USE_MOCKS) return; // real-API mode — nothing to start

    let active = true;
    (async () => {
      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'warn',
          serviceWorker: { url: '/mockServiceWorker.js' },
        });

        if (
          typeof navigator !== 'undefined' &&
          navigator.serviceWorker.controller === null
        ) {
          if (!window.sessionStorage.getItem(SW_RELOAD_KEY)) {
            window.sessionStorage.setItem(SW_RELOAD_KEY, '1');
            window.location.reload();
            return;
          }
        } else if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(SW_RELOAD_KEY);
        }

        if (active) setReady(true);
      } catch (err) {
        console.error(
          '[MSW] worker.start failed — requests will fall through to the dev server',
          err,
        );
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
