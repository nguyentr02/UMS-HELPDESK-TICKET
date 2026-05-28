import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@/mocks/server';

// --- Radix / jsdom polyfills (test-design §1.1) ---
// Radix primitives reach for browser APIs jsdom doesn't implement. These shims let
// component tests mount them; full open/pick interactions still belong to Playwright.
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.releasePointerCapture = vi.fn();

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof globalThis.PointerEvent === 'undefined') {
  globalThis.PointerEvent = class extends MouseEvent {} as unknown as typeof PointerEvent;
}

// --- MSW mock backend for the whole unit/component run ---
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Deterministic, fresh in-memory localStorage per test.
// (Node 25 ships an experimental WebStorage that is unreliable under jsdom; it also
// keeps SessionProvider's persisted role from leaking across tests.)
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.unstubAllGlobals();
});

afterAll(() => server.close());
