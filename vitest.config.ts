import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    // Coverage instrumentation ~doubles runtime; the default 5s ceiling
    // spuriously fails slow-but-correct tests (live-search → MSW round-trips).
    // A higher ceiling can't slow fast tests — it only stops false timeouts.
    testTimeout: 15000,
    // Node's fetch (and MSW interception) need an absolute base in tests.
    env: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost/api/v1' },
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['app/**', 'components/**', 'lib/**'],
      // Next.js route shells (page/layout/loading) are trivial wrappers that
      // render a composite — their flows are covered by Playwright e2e, not
      // jsdom unit tests. Excluding them keeps the gate honest about real logic.
      exclude: ['app/**/{page,layout,loading,error,not-found}.tsx'],
    },
  },
});
