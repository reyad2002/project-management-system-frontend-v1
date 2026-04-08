"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDashboardStats } from "@/hooks/use-statistics";
import { BarChart3, Receipt, TrendingUp } from "lucide-react";

function StatCard({
  title,
  value,
  sub,
  tone = "primary",
}: {
  title: string;
  value: string | number;
  sub?: string;
  tone?: "primary" | "emerald" | "amber" | "rose" | "sky";
}) {
  const toneStyles = {
    primary: "text-(--primary)",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    sky: "text-sky-700",
  }[tone];

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
          {title}
        </p>
        <p className={`mt-2 text-2xl font-bold tracking-tight ${toneStyles}`}>
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-(--muted)">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">
        Failed to load dashboard. Make sure the API is running at the configured
        URL.
      </div>
    );
  }

  const { overview, financial, projectsByStatus } = data;
  const outstandingReceivables =
    overview.totalProjectValue - overview.totalPaymentsReceived;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--muted)">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Overview of your projects and finances
        </h1>
       
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Clients"
          value={overview.totalClients}
          tone="primary"
        />
        <StatCard title="Projects" value={overview.totalProjects} tone="sky" />
        <StatCard
          title="Total project value"
          value={formatMoney(overview.totalProjectValue)}
          tone="emerald"
        />
        <StatCard
          title="Payments received"
          value={formatMoney(overview.totalPaymentsReceived)}
          sub={`${overview.totalPaymentsCount} payments`}
          tone="amber"
        />
        <StatCard
          title="Outstanding receivables"
          value={formatMoney(outstandingReceivables)}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-(--primary)" />
              Projects by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {Object.entries(projectsByStatus).map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between rounded-lg border border-(--card-border) px-4 py-3 text-sm"
                >
                  <span className="capitalize text-foreground">
                    {status.replace("_", " ")}
                  </span>
                  <span className="text-sm font-semibold text-(--primary)">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-(--primary)" />
              Financial summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-(--card-border) px-4 py-3 text-sm">
              <span className="font-medium text-(--muted)">Revenue</span>
              <span className="font-semibold text-emerald-700">
                {formatMoney(financial.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-(--card-border) px-4 py-3 text-sm">
              <span className="font-medium text-(--muted)">Total expenses</span>
              <span className="font-semibold text-rose-700">
                {formatMoney(financial.totalExpenses)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-(--card-border) px-4 py-3 text-sm">
              <span className="font-medium text-(--muted)">Net profit</span>
              <span className="font-semibold text-sky-700">
                {formatMoney(financial.netProfit)} (
                {financial.profitMargin.percent}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-(--primary)" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatMoney(overview.totalExpenses)}{" "}
            <span className="text-sm font-normal text-(--muted)">
              ({overview.totalExpensesCount} entries)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
