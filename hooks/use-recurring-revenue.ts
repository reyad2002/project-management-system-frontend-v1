"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringRevenueApi, type CreateRecurringRevenueInput, type RecurringRevenueStatus } from "@/lib/api";

export function useRecurringRevenue(params?: { status?: RecurringRevenueStatus; client_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: ["recurring-revenue", params],
    queryFn: () => recurringRevenueApi.list(params).then((r) => r.data),
  });
}

export function useUpcomingRecurringRevenue(days?: number) {
  return useQuery({
    queryKey: ["recurring-revenue", "upcoming", days],
    queryFn: () => recurringRevenueApi.upcoming(days).then((r) => r.data),
  });
}

export function useCreateRecurringRevenue() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Recurring revenue added" },
    mutationFn: (data: CreateRecurringRevenueInput) => recurringRevenueApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-revenue"] }),
  });
}

export function useUpdateRecurringRevenue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Recurring revenue saved" },
    mutationFn: (data: Partial<CreateRecurringRevenueInput>) =>
      recurringRevenueApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-revenue"] }),
  });
}

export function useDeleteRecurringRevenue() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Recurring revenue deleted" },
    mutationFn: (id: string) => recurringRevenueApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-revenue"] }),
  });
}

export function useMarkRecurringRevenuePaid() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Marked as paid" },
    mutationFn: (id: string) => recurringRevenueApi.markPaid(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-revenue"] });
      qc.invalidateQueries({ queryKey: ["finance", "hosting-summary"] });
      qc.invalidateQueries({ queryKey: ["finance", "subscriptions-comparison"] });
    },
  });
}
