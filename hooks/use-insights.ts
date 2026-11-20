"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insightsApi, type ContactKind } from "@/lib/api";

export function useProjectBudgets(includeDone = false) {
  return useQuery({
    queryKey: ["insights", "budgets", includeDone],
    queryFn: () => insightsApi.budgets(includeDone).then((r) => r.data),
  });
}

export function useClientProfitability(params: { from?: string; to?: string; all?: boolean }) {
  return useQuery({
    queryKey: ["insights", "client-profitability", params],
    queryFn: () => insightsApi.clientProfitability(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCashflow(days: 30 | 60 | 90, opening: number) {
  return useQuery({
    queryKey: ["insights", "cashflow", days, opening],
    queryFn: () => insightsApi.cashflow(days, opening).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

/** One client (client page) or all of them (health list). Finance roles only. */
export function useClientHealth(clientId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["insights", "client-health", clientId ?? "all"],
    queryFn: () => insightsApi.clientHealth(clientId).then((r) => r.data),
    enabled: options?.enabled ?? true,
  });
}

export function useClientContacts(clientId: string | null) {
  return useQuery({
    queryKey: ["client-contacts", clientId],
    queryFn: () => insightsApi.contacts.list(clientId!).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useLogContact(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Contact logged" },
    mutationFn: (data: { kind: ContactKind; note?: string; contacted_at?: string }) => insightsApi.contacts.log({ client_id: clientId, ...data }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-contacts", clientId] });
      // A fresh contact changes the health score.
      qc.invalidateQueries({ queryKey: ["insights", "client-health"] });
      qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}

export function useDeleteContact(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Contact deleted" },
    mutationFn: (id: string) => insightsApi.contacts.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-contacts", clientId] });
      qc.invalidateQueries({ queryKey: ["insights", "client-health"] });
    },
  });
}
