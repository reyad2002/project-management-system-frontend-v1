"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, type CreateInvoiceInput, type InvoiceStatus } from "@/lib/api";

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  project_id?: string;
  client_id?: string;
  status?: InvoiceStatus;
  from_date?: string;
  to_date?: string;
}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.list(params).then((r) => r.data),
    enabled: options?.enabled ?? true,
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoicesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateInvoiceInput>) => invoicesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      invoicesApi.cancel(id, reason).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", id] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}
