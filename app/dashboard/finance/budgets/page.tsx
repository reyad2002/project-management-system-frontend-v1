"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportButton } from "@/components/ui/ExportButton";
import { useProjectBudgets } from "@/hooks/use-insights";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/components/finance/monthFormat";
import type { ProjectBudget } from "@/lib/api";
import type { ExportColumn } from "@/lib/export";

const columns: ExportColumn<ProjectBudget>[] = [
  { header: "Project", value: (r) => r.title, width: 32 },
  { header: "Client", value: (r) => r.client_name, width: 24 },
  { header: "Status", value: (r) => r.status.replace("_", " ") },
  { header: "Budget", value: (r) => r.budget, kind: "money" },
  { header: "Actual cost", value: (r) => r.actual, kind: "money" },
  { header: "Remaining", value: (r) => r.remaining, kind: "money" },
  { header: "Used %", value: (r) => r.percent, kind: "number" },
];

const barColor = { ok: "bg-(--success)", warn: "bg-(--warning)", over: "bg-(--destructive)" } as const;

export default function BudgetsPage() {
  const { user } = useAuth();
  const [includeDone, setIncludeDone] = useState(false);
  const { data, isLoading, error } = useProjectBudgets(includeDone);

  if (!can(user, "finance")) return <p className="py-10 text-center text-(--muted)">Project budgets are for the finance roles.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project budgets</h1>
          <p className="mt-1 text-(--muted)">Expected cost against what each project has really cost. The managers are told when one reaches 80% and when it goes over.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-(--muted)">
            <input type="checkbox" checked={includeDone} onChange={(e) => setIncludeDone(e.target.checked)} className="h-4 w-4 accent-(--primary)" />
            Include completed projects
          </label>
          {data && <ExportButton filename="project-budgets" sheet="Budgets" columns={columns} fetchRows={async () => data.projects} />}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
        </div>
      ) : error || !data ? (
        <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">Couldn&apos;t load the budgets. If you just updated the app, make sure the backend has been deployed too.</div>
      ) : data.projects.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No project has a budget yet" description="Open a project, choose Edit, and fill in “Expected cost (budget)”. It will show here and warn you before the cost overshoots." />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Total budget</p>
                <p className="num mt-1 text-2xl font-semibold">{formatMoney(data.totals.budget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Spent so far</p>
                <p className="num mt-1 text-2xl font-semibold">{formatMoney(data.totals.actual)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Over budget</p>
                <p className={`num mt-1 text-2xl font-semibold ${data.totals.over > 0 ? "text-(--destructive)" : ""}`}>{data.totals.over}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-(--muted)">Close to the limit (80%+)</p>
                <p className={`num mt-1 text-2xl font-semibold ${data.totals.warn > 0 ? "text-(--warning)" : ""}`}>{data.totals.warn}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-(--border-subtle)">
                {data.projects.map((p) => (
                  <li key={p.id} className="space-y-2 px-4 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/dashboard/projects/${p.id}`} className="min-w-0 font-medium text-foreground hover:underline">
                        {p.title}
                        {p.client_name && <span className="ms-2 text-sm font-normal text-(--muted)">{p.client_name}</span>}
                      </Link>
                      <span className="flex items-center gap-2">
                        {p.level === "over" && (
                          <Badge variant="danger" dot={false}>
                            Over budget
                          </Badge>
                        )}
                        {p.level === "warn" && (
                          <Badge variant="warning" dot={false}>
                            Close to limit
                          </Badge>
                        )}
                        <span className="num text-sm font-semibold">{p.percent}%</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-(--muted-bg)" role="progressbar" aria-valuenow={Math.min(100, p.percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.title} budget used`}>
                      <div className={`h-full rounded-full ${barColor[p.level]}`} style={{ width: `${Math.min(100, p.percent)}%` }} />
                    </div>
                    <p className="text-xs text-(--muted)">
                      {formatMoney(p.actual)} of {formatMoney(p.budget)} ·{" "}
                      {p.remaining < 0 ? <span className="font-medium text-(--destructive)">over by {formatMoney(Math.abs(p.remaining))}</span> : `${formatMoney(p.remaining)} left`}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs text-(--muted)">Actual cost = the project&apos;s expenses plus its supplier bills (advances and equipment are not project costs), the same as the project&apos;s profitability tab.</p>
        </>
      )}
    </div>
  );
}
