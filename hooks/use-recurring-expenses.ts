"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringExpensesApi, type CreateRecurringExpenseInput, type RecurringExpenseStatus } from "@/lib/api";

export function useRecurringExpenses(params?: { status?: RecurringExpenseStatus; linked_project_id?: string }) {
  return useQuery({
    queryKey: ["recurring-expenses", params],
    queryFn: () => recurringExpensesApi.list(params).then((r) => r.data),
  });
}

export function useUpcomingRecurringExpenses(days?: number) {
  return useQuery({
    queryKey: ["recurring-expenses", "upcoming", days],
    queryFn: () => recurringExpensesApi.upcoming(days).then((r) => r.data),
  });
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Subscription added" },
    mutationFn: (data: CreateRecurringExpenseInput) => recurringExpensesApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-expenses"] }),
  });
}

export function useUpdateRecurringExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Subscription saved" },
    mutationFn: (data: Partial<CreateRecurringExpenseInput>) =>
      recurringExpensesApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-expenses"] }),
  });
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Subscription deleted" },
    mutationFn: (id: string) => recurringExpensesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-expenses"] }),
  });
}

export function useMarkRecurringExpensePaid() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Marked as paid" },
    mutationFn: (id: string) => recurringExpensesApi.markPaid(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-expenses"] });
      qc.invalidateQueries({ queryKey: ["finance", "subscriptions-comparison"] });
    },
  });
}
