'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Starts the MSW browser worker before rendering children so client queries hit
 * the mock backend (this project has no real BE). Gating avoids a flash of error
 * states from requests that fire before the worker registers.
 */
export function MswReady({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
