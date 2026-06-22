import { useEffect, useState } from 'react';

/**
 * Returns a copy of `value` that only updates after it has stopped changing for
 * `delayMs`. Used to debounce search-box text before it feeds a query key, so
 * typing stays instant (the input is bound to the live value) while the network
 * request fires once the user pauses — not on every keystroke.
 *
 * The `setState` runs inside the timeout callback (not synchronously in the
 * effect body), so it doesn't trip `react-hooks/set-state-in-effect`.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}