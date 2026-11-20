"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi, type CreateExpenseInput } from "@/lib/api";

export function useExpenses(params?: {
  page?: number;
  limit?: number;
  type?: string;
  cost_category?: string;
  project_id?: string;
  from_date?: string;
  to_date?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => expensesApi.list(params).then((r) => r.data),
  });
}

export function useExpense(id: string | null) {
  return useQuery({
    queryKey: ["expenses", id],
    queryFn: () => expensesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Expense added" },
    mutationFn: (data: CreateExpenseInput) => expensesApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Expense saved" },
    mutationFn: (data: Partial<CreateExpenseInput>) => expensesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expenses", id] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Expense deleted" },
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
