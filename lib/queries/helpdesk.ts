'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as ticketsApi from '@/lib/api/tickets';
import type { Severity } from '@/lib/types/domain';
import { ticketKeys } from './tickets';
import { analyticsKeys } from './analytics';

/** Refetch everything a transition can touch: the ticket, its history, all
 *  lists, AND the dashboard summary (status/severity counts shift on every
 *  transition — without this the dashboard shows stale counts). */
export function invalidateTicket(qc: QueryClient, id: string) {
  qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
  qc.invalidateQueries({ queryKey: ticketKeys.history(id) });
  qc.invalidateQueries({ queryKey: ticketKeys.all });
  qc.invalidateQueries({ queryKey: analyticsKeys.summary });
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

/** Agent/Lead direct redirect to another department. */
export function useRedirectTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { departmentId: string; reason: string }) =>
      ticketsApi.redirectTicket(id, vars.departmentId, vars.reason),
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

export function useAssignCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string | null) => ticketsApi.assignCategory(id, categoryId),
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

/** DeptStaff submits a close request (proof comment + optional images). */
export function useRequestClose(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => ticketsApi.requestClose(id, form),
    onSuccess: () => {
      invalidateTicket(qc, id);
      qc.invalidateQueries({ queryKey: ticketKeys.comments(id) });
    },
  });
}

/** Owning Agent/Lead approves a pending close request → Closed. */
export function useApproveClose(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => ticketsApi.approveClose(id, reason),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

/** Owning Agent/Lead refuses (reason required) → back to InProgress. */
export function useRefuseClose(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => ticketsApi.refuseClose(id, reason),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

/** DeptStaff submits a redirect request (reason only). */
export function useRequestRedirect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => ticketsApi.requestRedirect(id, reason),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

/** Owning Agent/Lead approves a redirect request — picks the target dept. */
export function useApproveRedirect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { departmentId: string; note?: string }) =>
      ticketsApi.approveRedirect(id, vars.departmentId, vars.note),
    onSuccess: () => invalidateTicket(qc, id),
  });
}

/** Owning Agent/Lead refuses a redirect request (reason required). */
export function useRefuseRedirect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => ticketsApi.refuseRedirect(id, reason),
    onSuccess: () => invalidateTicket(qc, id),
  });
}
