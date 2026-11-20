"use client";

import { usePortalProjectReports } from "@/hooks/use-portal";
import type { ProjectType } from "@/lib/api";
import { ExportButton } from "@/components/ui/ExportButton";
import { fileSafe, reportColumns } from "@/lib/export-columns";
import { REPORT_METRICS, costPerLead, formatMetric, formatMonth } from "@/components/reports/reportMetrics";

interface PortalReportsTabProps {
  projectId: string;
  projectType: ProjectType;
  projectTitle?: string;
}

export function PortalReportsTab({ projectId, projectType, projectTitle }: PortalReportsTabProps) {
  const { data, isLoading } = usePortalProjectReports(projectId);
  const metrics = REPORT_METRICS[projectType] ?? [];
  const showCostPerLead = metrics.some((m) => m.key === "leads") && metrics.some((m) => m.key === "ad_spend");
  const reports = data?.reports ?? [];

  if (isLoading) return <p className="text-(--muted)">Loading reports...</p>;
  if (reports.length === 0) return <p className="text-(--muted)">No monthly reports published yet.</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton
          filename={`monthly-reports-${fileSafe(projectTitle, "project")}`}
          sheet="Monthly reports"
          columns={reportColumns(projectType)}
          fetchRows={async () => [...reports].sort((a, b) => a.period_month.localeCompare(b.period_month))}
        />
      </div>
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id} className="rounded-xl border border-(--card-border) bg-(--surface) p-4">
          <h3 className="font-medium">{formatMonth(r.period_month)}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.key}>
                <dt className="text-(--muted)">{m.label}</dt>
                <dd className="num text-base font-semibold">{formatMetric(m, r)}</dd>
              </div>
            ))}
            {showCostPerLead && (
              <div>
                <dt className="text-(--muted)">Cost / lead</dt>
                <dd className="num text-base font-semibold">{costPerLead(r) ?? "—"}</dd>
              </div>
            )}
          </dl>
          {r.summary && <p className="mt-3 whitespace-pre-line text-sm text-(--foreground)">{r.summary}</p>}
        </li>
      ))}
    </ul>
    </div>
  );
}
