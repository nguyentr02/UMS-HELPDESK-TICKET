import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Browser-side mock worker, used by the dev app (and Playwright via the dev server).
export const worker = setupWorker(...handlers);
