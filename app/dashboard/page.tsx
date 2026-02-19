"use client";

import { useDashboardStats } from "@/hooks/use-statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Users,
  FolderKanban,
  CreditCard,
  Receipt,
  TrendingUp,
  Wallet,
  BarChart3,
} from "lucide-react";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
        </div>
        <div className="rounded-lg bg-[var(--accent-muted)] p-3 text-[var(--primary)]">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

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
        Failed to load dashboard. Make sure the API is running at the configured URL.
      </div>
    );
  }

  const { overview, financial, projectsByStatus } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-1 text-[var(--muted)]">Overview of your projects and finances</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clients" value={overview.totalClients} icon={Users} />
        <StatCard title="Projects" value={overview.totalProjects} icon={FolderKanban} />
        <StatCard
          title="Total project value"
          value={formatMoney(overview.totalProjectValue)}
          icon={Wallet}
        />
        <StatCard
          title="Payments received"
          value={formatMoney(overview.totalPaymentsReceived)}
          sub={`${overview.totalPaymentsCount} payments`}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
              Projects by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(projectsByStatus).map(([status, count]) => (
                <li
                  key={status}
                  className="flex justify-between rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm"
                >
                  <span className="capitalize text-[var(--foreground)]">{status.replace("_", " ")}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
              Financial summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Revenue</span>
              <span className="font-medium">{formatMoney(financial.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Total expenses</span>
              <span className="font-medium">{formatMoney(financial.totalExpenses)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
              <span className="text-[var(--muted)]">Net profit</span>
              <span className="font-semibold text-[var(--primary)]">
                {formatMoney(financial.netProfit)} ({financial.profitMargin.percent}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[var(--primary)]" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {formatMoney(overview.totalExpenses)} <span className="text-sm font-normal text-[var(--muted)]">({overview.totalExpensesCount} entries)</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
