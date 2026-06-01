'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationLoadingValue {
  isNavigating: boolean;
  /** Mark a route-changing action as in-flight. Cleared when `pathname` next changes. */
  startNavigation: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingValue | null>(null);

/**
 * Covers the gap between a programmatic `router.push()` and the new route
 * mounting: during that gap the *old* page is still mounted but already
 * re-rendering with whatever state changed (e.g. a new role), which can
 * flash role-guard messages like "no permission" until Next swaps the page.
 */
export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [fromPath, setFromPath] = useState<string | null>(null);

  // Clear the overlay as soon as the URL has actually moved.
  useEffect(() => {
    if (isNavigating && fromPath !== null && pathname !== fromPath) {
      setIsNavigating(false);
      setFromPath(null);
    }
  }, [pathname, isNavigating, fromPath]);

  function startNavigation() {
    setFromPath(pathname);
    setIsNavigating(true);
  }

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
      {isNavigating ? <NavigationOverlay /> : null}
    </NavigationLoadingContext.Provider>
  );
}

/**
 * Safe to call outside a provider — returns a noop so unit tests that render
 * a single component (without `NavigationLoadingProvider`) keep working.
 */
export function useNavigationLoading(): NavigationLoadingValue {
  return (
    useContext(NavigationLoadingContext) ?? {
      isNavigating: false,
      startNavigation: () => {},
    }
  );
}

function NavigationOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang chuyển trang"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow">
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"
        />
        <span className="text-sm font-medium">Đang chuyển…</span>
      </div>
    </div>
  );
}
