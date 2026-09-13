"use client";

import { useQuery } from "@tanstack/react-query";
import { statisticsApi } from "@/lib/api";

export function useDashboardStats(params?: { from_date?: string; to_date?: string }) {
  return useQuery({
    queryKey: ["statistics", "dashboard", params],
    queryFn: () => statisticsApi.dashboard(params).then((r) => r.data),
  });
}

export function useFinancialStats(params?: {
  from_date?: string;
  to_date?: string;
  basis?: "accrual" | "cash";
}) {
  return useQuery({
    queryKey: ["statistics", "financial", params],
    queryFn: () => statisticsApi.financial(params).then((r) => r.data),
  });
}

export function useArAging(params?: { client_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: ["statistics", "ar-aging", params],
    queryFn: () => statisticsApi.arAging(params).then((r) => r.data),
  });
}

export function useApAging(params?: { vendor_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: ["statistics", "ap-aging", params],
    queryFn: () => statisticsApi.apAging(params).then((r) => r.data),
  });
}

export function useProjectProfitability(projectId?: string) {
  return useQuery({
    queryKey: ["statistics", "project-profitability", projectId],
    queryFn: () =>
      statisticsApi
        .projectProfitability(projectId ? { project_id: projectId } : undefined)
        .then((r) => r.data),
    enabled: !!projectId,
  });
}
