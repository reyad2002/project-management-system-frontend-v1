"use client";

import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSubscriptionsSummary } from "@/hooks/use-statistics";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

export function SubscriptionsComparisonWidget() {
  const { data, isLoading } = useSubscriptionsSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-(--primary)" />
          Hosting revenue vs. subscription costs (next ~2 weeks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <p className="text-(--muted)">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-(--muted)">Expected revenue</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatMoney(data.revenue.upcomingTotal)}
              </p>
              {data.revenue.overdueTotal > 0 && (
                <p className="text-xs text-(--destructive)">{formatMoney(data.revenue.overdueTotal)} overdue</p>
              )}
            </div>
            <div>
              <p className="text-sm text-(--muted)">Expected cost</p>
              <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                {formatMoney(data.expenses.upcomingTotal)}
              </p>
              {data.expenses.overdueTotal > 0 && (
                <p className="text-xs text-(--destructive)">{formatMoney(data.expenses.overdueTotal)} overdue</p>
              )}
            </div>
            <div>
              <p className="text-sm text-(--muted)">Net projected</p>
              <p
                className={`text-lg font-semibold ${
                  data.netProjected >= 0 ? "text-(--primary)" : "text-(--destructive)"
                }`}
              >
                {formatMoney(data.netProjected)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
