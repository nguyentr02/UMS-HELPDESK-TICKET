'use client';

import { useEffect, useState, type ReactNode } from 'react';

const SW_RELOAD_KEY = '__msw_reload_once';

/**
 * Starts the MSW browser worker before rendering children so client queries hit
 * the mock backend (this project has no real BE). Gating avoids a flash of error
 * states from requests that fire before the worker registers.
 *
 * Two robustness fixes vs. the naive version:
 *  - `onUnhandledRequest: 'warn'` so URLs MSW doesn't know about show up in the
 *    browser console instead of silently falling through to the dev server (404).
 *  - On the FIRST registration the current page isn't yet under SW control, so
 *    early requests would bypass to the network. Reload once (sessionStorage-
 *    gated to prevent loops) so the SW takes control of the page.
 */
export function MswReady({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
            return; // the page is reloading; don't flip `ready`
          }
        } else if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(SW_RELOAD_KEY);
        }

        if (active) setReady(true);
      } catch (err) {
        // Surface the error instead of swallowing it. Still render children so
        // a broken mock doesn't blank-screen the app — the warnings will make
        // it obvious in the console that requests are going to the dev server.
        // eslint-disable-next-line no-console
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
