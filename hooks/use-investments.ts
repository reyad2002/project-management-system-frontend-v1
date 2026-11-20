"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentsApi, type CreateInvestmentInput } from "@/lib/api";

export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn: () => investmentsApi.list().then((r) => r.data),
  });
}

export function useInvestment(id: string | null) {
  return useQuery({
    queryKey: ["investments", id],
    queryFn: () => investmentsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useInvestmentsSummary() {
  return useQuery({
    queryKey: ["investments", "summary"],
    queryFn: () => investmentsApi.summary().then((r) => r.data),
  });
}

export function useInvestmentReturns(investmentId: string | null) {
  return useQuery({
    queryKey: ["investments", investmentId, "returns"],
    queryFn: () => investmentsApi.listReturns(investmentId!).then((r) => r.data),
    enabled: !!investmentId,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Investment added" },
    mutationFn: (data: CreateInvestmentInput) => investmentsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function useUpdateInvestment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Investment saved" },
    mutationFn: (data: Partial<CreateInvestmentInput>) => investmentsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["investments", id] });
    },
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Investment deleted" },
    mutationFn: (id: string) => investmentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export function useAddInvestmentReturn(investmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Return recorded" },
    mutationFn: (data: { amount: number; received_date: string }) =>
      investmentsApi.addReturn(investmentId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments", "summary"] });
      qc.invalidateQueries({ queryKey: ["investments", investmentId] });
    },
  });
}
