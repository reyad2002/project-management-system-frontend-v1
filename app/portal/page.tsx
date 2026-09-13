"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePortalProjects, usePortalPaymentSummary } from "@/hooks/use-portal";
import { projectStatusVariant } from "@/lib/status-badges";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function PortalDashboardPage() {
  const { data: projectsData, isLoading } = usePortalProjects();
  const { data: summary } = usePortalPaymentSummary();

  const projects = projectsData?.projects ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your projects</h1>
        <p className="mt-1 text-(--muted)">An overview of your work with CodeWars EG</p>
      </div>

      {summary && (
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-(--muted)">Total amount</p>
              <p className="text-lg font-semibold">{formatMoney(summary.total_amount_to_pay)}</p>
            </div>
            <div>
              <p className="text-sm text-(--muted)">Paid</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatMoney(summary.amount_paid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-(--muted)">Remaining</p>
              <p className="text-lg font-semibold">{formatMoney(summary.remaining)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-(--muted)">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="py-8 text-center text-(--muted)">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/portal/projects/${p.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-3 py-2 text-sm transition-colors hover:bg-sky-50/40"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-(--foreground)">{p.title}</span>
                      <Badge variant={projectStatusVariant[p.status]}>{p.status.replace("_", " ")}</Badge>
                    </span>
                    {p.due_date && <span className="text-(--muted)">Due {p.due_date}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
