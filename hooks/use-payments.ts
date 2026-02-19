"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, type CreatePaymentInput } from "@/lib/api";

export function usePayments(params?: {
  page?: number;
  limit?: number;
  project_id?: string;
  client_id?: string;
  from_date?: string;
  to_date?: string;
}) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => paymentsApi.list(params).then((r) => r.data),
  });
}

export function usePayment(id: string | null) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => paymentsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentInput) => paymentsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdatePayment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreatePaymentInput>) => paymentsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
