"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { ExportButton } from "@/components/ui/ExportButton";
import { fileSafe, reportColumns } from "@/lib/export-columns";
import { useProjectReports, useSaveProjectReport, useDeleteProjectReport } from "@/hooks/use-project-reports";
import type { ProjectReport, ProjectReportInput, ProjectType } from "@/lib/api";
import { REPORT_METRICS, costPerLead, formatMetric, formatMonth, type MetricDef } from "./reportMetrics";

const FORM_ID = "project-report-form";

interface ProjectReportsTabProps {
  projectId: string;
  projectType: ProjectType;
  /** Used to name the exported file. */
  projectTitle?: string;
}

type FormState = { period: string; summary: string } & Record<string, string>;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toForm(report: ProjectReport | null, metrics: MetricDef[]): FormState {
  const state: FormState = {
    period: report ? report.period_month.slice(0, 7) : currentMonth(),
    summary: report?.summary ?? "",
  };
  for (const m of metrics) {
    const v = report?.[m.key];
    state[m.key] = v === null || v === undefined ? "" : String(v);
  }
  return state;
}

export function ProjectReportsTab({ projectId, projectType, projectTitle }: ProjectReportsTabProps) {
  const metrics = REPORT_METRICS[projectType] ?? [];
  const showCostPerLead = metrics.some((m) => m.key === "leads") && metrics.some((m) => m.key === "ad_spend");

  const { data, isLoading } = useProjectReports(projectId);
  const save = useSaveProjectReport(projectId);
  const remove = useDeleteProjectReport(projectId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectReport | null>(null);
  const [form, setForm] = useState<FormState>(() => toForm(null, metrics));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ProjectReport | null>(null);

  const reports = data?.reports ?? [];

  const openModal = (report: ProjectReport | null) => {
    setEditing(report);
    setForm(toForm(report, metrics));
    setFieldError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(form.period)) {
      setFieldError("Choose a month");
      return;
    }
    const payload: ProjectReportInput = { period_month: form.period, summary: form.summary.trim() || null };
    for (const m of metrics) {
      const raw = form[m.key].trim();
      if (raw === "") {
        // ad_spend is NOT NULL in the DB (defaults to 0); the other metrics may be left untracked.
        if (m.key === "ad_spend") payload.ad_spend = 0;
        else payload[m.key] = null;
        continue;
      }
      const n = Number(raw);
      const valid = m.key === "ad_spend" ? Number.isFinite(n) && n >= 0 : Number.isInteger(n) && (m.allowNegative || n >= 0);
      if (!valid) {
        setFieldError(`${m.label} must be a ${m.key === "ad_spend" ? "positive number" : "whole number"}`);
        return;
      }
      payload[m.key] = n;
    }
    setFieldError(null);
    await save.mutateAsync({ id: editing?.id, ...payload });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-(--muted)">
          Monthly results for this project. The client sees these in their portal.
        </p>
        <div className="flex items-center gap-2">
          <ExportButton
            filename={`monthly-reports-${fileSafe(projectTitle, "project")}`}
            sheet="Monthly reports"
            columns={reportColumns(projectType)}
            fetchRows={async () => [...reports].sort((a, b) => a.period_month.localeCompare(b.period_month))}
          />
          <Button size="sm" onClick={() => openModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-(--muted)">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-(--muted)">No reports yet. Add the first month&apos;s numbers.</p>
      ) : (
        <Table>
          <TableHead>
            <Th>Month</Th>
            {metrics.map((m) => (
              <Th key={m.key}>{m.label}</Th>
            ))}
            {showCostPerLead && <Th>Cost / lead</Th>}
            <Th align="right">Actions</Th>
          </TableHead>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id}>
                <Td className="font-medium">{formatMonth(r.period_month)}</Td>
                {metrics.map((m) => (
                  <Td key={m.key} label={m.label} className="num">
                    {formatMetric(m, r)}
                  </Td>
                ))}
                {showCostPerLead && (
                  <Td label="Cost / lead" className="num">
                    {costPerLead(r) ?? "—"}
                  </Td>
                )}
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openModal(r)} aria-label="Edit report">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(r)} aria-label="Delete report">
                      <Trash2 className="h-4 w-4 text-(--destructive)" />
                    </Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {modalOpen && (
        <Modal
          open
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit report" : "New monthly report"}
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form={FORM_ID} loading={save.isPending}>
                {editing ? "Update" : "Save"}
              </Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={handleSubmit} className="form-stagger space-y-4">
            <Input
              label="Month *"
              type="month"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map((m) => (
                <Input
                  key={m.key}
                  label={m.label}
                  type="number"
                  min={m.allowNegative ? undefined : 0}
                  step={m.key === "ad_spend" ? "0.01" : "1"}
                  value={form[m.key]}
                  onChange={(e) => setForm({ ...form, [m.key]: e.target.value })}
                />
              ))}
            </div>
            <Textarea
              label="Summary for the client"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
            {fieldError && (
              <p role="alert" className="text-sm text-(--destructive)">
                {fieldError}
              </p>
            )}
            {!editing && (
              <p className="text-xs text-(--muted)">
                If this month already has a report, saving replaces it.
              </p>
            )}
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete report?"
        description="This removes the month's numbers from the client portal too."
        confirmText="Delete"
        isLoading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </div>
  );
}
