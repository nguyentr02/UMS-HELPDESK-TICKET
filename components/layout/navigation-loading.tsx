'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useIsRestoring } from '@tanstack/react-query';
import { useSessionOptional } from '@/lib/auth/session';

interface NavigationLoadingValue {
  isNavigating: boolean;
  /**
   * Mark a route-changing action as in-flight. Pass the target path so a
   * navigation to the *current* page (which `router.push` treats as a no-op
   * and doesn't trigger `usePathname` to change) is skipped instead of
   * hanging the overlay forever.
   */
  startNavigation: (target?: string) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingValue | null>(null);

/** Hard ceiling for the overlay — if pathname hasn't moved after this long,
 *  clear anyway. Covers any future stall mode we haven't thought of. */
const OVERLAY_MAX_MS = 1500;

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
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearOverlay() {
    setIsNavigating(false);
    setFromPath(null);
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }

  // Primary clear: pathname actually moved.
  useEffect(() => {
    if (isNavigating && fromPath !== null && pathname !== fromPath) {
      clearOverlay();
    }
  }, [pathname, isNavigating, fromPath]);

  // Cleanup on unmount so we never leak a pending timer.
  useEffect(() => {
    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, []);

  function startNavigation(target?: string) {
    // Same-path navigations don't trigger usePathname to change, so the primary
    // clear-effect would never fire — skip the overlay entirely. This is the
    // SV→GV→NV case (all three share /tickets/new as their home).
    if (target && target === pathname) return;

    setFromPath(pathname);
    setIsNavigating(true);

    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(() => {
      clearOverlay();
    }, OVERLAY_MAX_MS);
  }

  // Suppress our overlay whenever the AppBootGate is already (or about to be)
  // showing its full-screen LoadingSplash — otherwise the user sees both at
  // once. The gate fires on session boot, persister rehydration, and the
  // 300ms isTransitioning window after a role switch (which is the most
  // common collision: the role switcher calls both startNavigation AND
  // setIdentity in the same click). `useSessionOptional` returns null when
  // we're rendered in isolation (unit tests), in which case we just behave
  // as if the boot gate isn't covering.
  const session = useSessionOptional();
  const isRestoring = useIsRestoring();
  const bootGateCovering =
    session !== null && (!session.isReady || isRestoring || session.isTransitioning);
  const showOverlay = isNavigating && !bootGateCovering;

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
      {showOverlay ? <NavigationOverlay /> : null}
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
