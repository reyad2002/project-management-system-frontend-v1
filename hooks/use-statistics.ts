"use client";

import { useQuery } from "@tanstack/react-query";
import { statisticsApi, financeSummaryApi, recurringRevenueApi, recurringExpensesApi } from "@/lib/api";

function sumAmount(rows: { amount: number }[]) {
  return Math.round(rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0) * 100) / 100;
}

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

export function useHostingSummary() {
  return useQuery({
    queryKey: ["finance", "hosting-summary"],
    queryFn: () => financeSummaryApi.hosting().then((r) => r.data),
  });
}

/**
 * There is no dedicated backend summary endpoint for this comparison — it's assembled
 * client-side from the recurring-revenue and recurring-expenses upcoming/overdue endpoints.
 */
export function useSubscriptionsSummary() {
  return useQuery({
    queryKey: ["finance", "subscriptions-comparison"],
    queryFn: async () => {
      const [revenueUpcoming, revenueOverdue, expensesUpcoming, expensesOverdue] = await Promise.all([
        recurringRevenueApi.upcoming().then((r) => r.data.recurringRevenue),
        recurringRevenueApi.overdue().then((r) => r.data.recurringRevenue),
        recurringExpensesApi.upcoming().then((r) => r.data.recurringExpenses),
        recurringExpensesApi.overdue().then((r) => r.data.recurringExpenses),
      ]);

      const revenue = { upcomingTotal: sumAmount(revenueUpcoming), overdueTotal: sumAmount(revenueOverdue) };
      const expenses = { upcomingTotal: sumAmount(expensesUpcoming), overdueTotal: sumAmount(expensesOverdue) };

      return {
        revenue,
        expenses,
        netProjected: Math.round((revenue.upcomingTotal - expenses.upcomingTotal) * 100) / 100,
      };
    },
  });
}
