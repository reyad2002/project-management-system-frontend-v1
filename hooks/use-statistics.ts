"use client";

import { useQuery } from "@tanstack/react-query";
import { statisticsApi } from "@/lib/api";

export function useDashboardStats(params?: { from_date?: string; to_date?: string }) {
  return useQuery({
    queryKey: ["statistics", "dashboard", params],
    queryFn: () => statisticsApi.dashboard(params).then((r) => r.data),
  });
}

export function useFinancialStats(params?: { from_date?: string; to_date?: string }) {
  return useQuery({
    queryKey: ["statistics", "financial", params],
    queryFn: () => statisticsApi.financial(params).then((r) => r.data),
  });
}
