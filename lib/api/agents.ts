import { apiFetch } from './client';
import type { UserRef } from '@/lib/types/domain';

// NOTE: `GET /agents` is a FE-driven addition — the Assign dialog needs the list of
// HelpdeskAgent users (assign takes an agentId that must resolve to a HelpdeskAgent).
export const listAgents = () => apiFetch<UserRef[]>('/agents');
