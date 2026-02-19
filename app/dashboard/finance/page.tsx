"use client";

import { useState } from "react";
import { useFinancialStats } from "@/hooks/use-statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number) {
  return `${n}%`;
}

export default function FinancePage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params =
    fromDate && toDate
      ? { from_date: fromDate, to_date: toDate }
      : undefined;
  const { data, isLoading, error } = useFinancialStats(params);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-[var(--destructive)] bg-red-50 p-4 text-[var(--destructive)]">
        Failed to load financial data. Make sure the API is running at the configured URL.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Finance</h1>
          <p className="mt-1 text-[var(--muted)]">
            Revenue, expenses, and profit overview
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            type="date"
            label="From"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            type="date"
            label="To"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          {data.dateRange && (
            <p className="text-xs text-[var(--muted)]">
              {data.dateRange.from_date} → {data.dateRange.to_date}
            </p>
          )}
        </div>
      </div>

      {/* Top line: Revenue & Expenses */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                {formatMoney(data.totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Total expenses</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                {formatMoney(data.totalExpenses)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Direct {formatMoney(data.directExpenses)} · Operational {formatMoney(data.operationalExpenses)}
              </p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Gross profit</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                {formatMoney(data.grossProfit)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Margin {formatPercent(data.grossMargin.percent)}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--accent-muted)] p-3 text-[var(--primary)]">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Net profit</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--primary)]">
                {formatMoney(data.netProfit)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Margin {formatPercent(data.profitMargin.percent)}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--accent-muted)] p-3 text-[var(--primary)]">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margins & breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-[var(--primary)]" />
              Margins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Gross margin</span>
              <span className="font-medium">{formatPercent(data.grossMargin.percent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Operating margin</span>
              <span className="font-medium">{formatPercent(data.operatingMargin.percent)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
              <span className="text-[var(--muted)]">Profit margin</span>
              <span className="font-semibold text-[var(--primary)]">
                {formatPercent(data.profitMargin.percent)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-[var(--primary)]" />
              Income breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Revenue</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatMoney(data.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">− Direct expenses</span>
              <span className="font-medium">{formatMoney(data.directExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">− Operational expenses</span>
              <span className="font-medium">{formatMoney(data.operationalExpenses)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
              <span className="text-[var(--muted)]">Operating income</span>
              <span className="font-medium">{formatMoney(data.operatingIncome)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm">
              <span className="font-medium text-[var(--foreground)]">Net profit</span>
              <span className="font-semibold text-[var(--primary)]">
                {formatMoney(data.netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
