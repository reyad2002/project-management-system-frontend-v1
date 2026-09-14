"use client";

import Link from "next/link";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useHostingSummary } from "@/hooks/use-statistics";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

export function UpcomingRenewalsWidget() {
  const { data, isLoading } = useHostingSummary();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-(--primary)" />
          Upcoming renewals
        </CardTitle>
        <Link href="/dashboard/hosting">
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !data ? (
          <p className="text-(--muted)">Loading...</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-(--card-border) px-3 py-2">
                <p className="text-xs text-(--muted)">Expected upcoming (this + next month)</p>
                <p className="text-lg font-semibold text-(--foreground)">
                  {formatMoney(data.upcomingTotal)}
                  <span className="ml-1 text-xs font-normal text-(--muted)">({data.upcomingCount})</span>
                </p>
              </div>
              <div
                className={`rounded-lg border px-3 py-2 ${
                  data.overdueCount > 0 ? "border-(--destructive) bg-(--destructive-bg)" : "border-(--card-border)"
                }`}
              >
                <p className={`flex items-center gap-1 text-xs ${data.overdueCount > 0 ? "text-(--destructive)" : "text-(--muted)"}`}>
                  {data.overdueCount > 0 && <AlertTriangle className="h-3.5 w-3.5" />}
                  Overdue
                </p>
                <p className={`text-lg font-semibold ${data.overdueCount > 0 ? "text-(--destructive)" : "text-(--foreground)"}`}>
                  {formatMoney(data.overdueTotal)}
                  <span className="ml-1 text-xs font-normal opacity-80">({data.overdueCount})</span>
                </p>
              </div>
            </div>

            {data.items.length === 0 ? (
              <p className="text-sm text-(--muted)">No upcoming renewals.</p>
            ) : (
              <ul className="space-y-2">
                {data.items.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-(--foreground)">
                        {u.client_name ?? "—"}
                        <span className="text-(--muted)"> · {u.type}</span>
                      </p>
                      <p className="text-xs text-(--muted)">{u.next_renewal_date}</p>
                    </div>
                    <span className="shrink-0 font-medium text-(--foreground)">{formatMoney(u.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
