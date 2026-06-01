import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NavigationLoadingProvider,
  useNavigationLoading,
} from '@/components/layout/navigation-loading';

// usePathname has to be controllable so the test can simulate "URL changed"
// vs. "URL never changes" (the bug repro).
let mockPathname = '/tickets/new';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

function TestHarness({ target }: { target: string }) {
  const { isNavigating, startNavigation } = useNavigationLoading();
  return (
    <div>
      <span data-testid="state">{isNavigating ? 'loading' : 'idle'}</span>
      <button onClick={() => startNavigation(target)}>go</button>
    </div>
  );
}

function setup(target: string) {
  return render(
    <NavigationLoadingProvider>
      <TestHarness target={target} />
    </NavigationLoadingProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  mockPathname = '/tickets/new';
});
afterEach(() => {
  vi.useRealTimers();
});

describe('NavigationLoadingProvider', () => {
  it('shows the overlay when navigating to a different path', () => {
    setup('/analytics');
    act(() => {
      screen.getByText('go').click();
    });
    expect(screen.getByTestId('state').textContent).toBe('loading');
  });

  it('clears the overlay when pathname changes', () => {
    const { rerender } = setup('/analytics');
    act(() => {
      screen.getByText('go').click();
    });
    expect(screen.getByTestId('state').textContent).toBe('loading');

    // Simulate Next router moving us to the new path.
    mockPathname = '/analytics';
    rerender(
      <NavigationLoadingProvider>
        <TestHarness target="/analytics" />
      </NavigationLoadingProvider>,
    );
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });

  it('does NOT show the overlay when target === current path (bug repro: SV→GV both /tickets/new)', () => {
    setup('/tickets/new'); // same as mockPathname
    act(() => {
      screen.getByText('go').click();
    });
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });

  it('falls back to clearing the overlay after the safety timeout if pathname never moves', () => {
    setup('/analytics');
    act(() => {
      screen.getByText('go').click();
    });
    expect(screen.getByTestId('state').textContent).toBe('loading');

    // pathname stays put (some external thing aborted navigation) — the safety
    // timer must still clear the overlay so the app isn't permanently stuck.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });
});
