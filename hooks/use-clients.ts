"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, type CreateClientInput, type Client } from "@/lib/api";

export function useClients(params?: { page?: number; limit?: number; q?: string }) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => clientsApi.list(params).then((r) => r.data),
  });
}

export function useClientsShortList() {
  return useQuery({
    queryKey: ["clients", "shortList"],
    queryFn: () => clientsApi.shortList().then((r) => r.data),
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => clientsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useClientPaymentSummary(id: string | null) {
  return useQuery({
    queryKey: ["clients", id, "payment-summary"],
    queryFn: () => clientsApi.getPaymentSummary(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => clientsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateClientInput>) => clientsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
