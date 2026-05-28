'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as ticketsApi from '@/lib/api/tickets';
import type { Severity } from '@/lib/types/domain';
import { ticketKeys } from './tickets';

/** Refetch everything a transition can touch: the ticket, its history, and all lists. */
export function invalidateTicket(qc: QueryClient, id: string) {
  qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
  qc.invalidateQueries({ queryKey: ticketKeys.history(id) });
  qc.invalidateQueries({ queryKey: ticketKeys.all });
}

export function useAssignAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => ticketsApi.assignAgent(id, agentId),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

export function useForwardTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => ticketsApi.forwardTicket(id, departmentId),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

export function useRedirectTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { departmentId: string; reason: string }) =>
      ticketsApi.redirectTicket(id, input.departmentId, input.reason),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

export function useOverrideSeverity(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (severity: Severity) => ticketsApi.overrideSeverity(id, severity),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

export function useStartProgress(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ticketsApi.startProgress(id),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

export function useCloseTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => ticketsApi.closeTicket(id, note),
    onSuccess: () => invalidateTicket(qc, id),
  });
}
