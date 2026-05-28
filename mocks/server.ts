import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Node-side mock server, used by Vitest (tests/setup.ts).
export const server = setupServer(...handlers);
