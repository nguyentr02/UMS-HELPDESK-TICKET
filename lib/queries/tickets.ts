'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ticketsApi from '@/lib/api/tickets';
import type { ListTicketsQuery } from '@/lib/types/domain';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (q?: ListTicketsQuery) => ['tickets', q ?? {}] as const,
  detail: (id: string) => ['ticket', id] as const,
  history: (id: string) => ['ticket', id, 'history'] as const,
};

export function useTickets(query?: ListTicketsQuery) {
  return useQuery({
    queryKey: ticketKeys.list(query),
    queryFn: () => ticketsApi.listTickets(query),
  });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: ticketKeys.detail(id), queryFn: () => ticketsApi.getTicket(id) });
}

export function useTicketHistory(id: string) {
  return useQuery({
    queryKey: ticketKeys.history(id),
    queryFn: () => ticketsApi.getTicketHistory(id),
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => ticketsApi.createTicket(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useAddComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => ticketsApi.addComment(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ticketKeys.history(id) });
    },
  });
}
