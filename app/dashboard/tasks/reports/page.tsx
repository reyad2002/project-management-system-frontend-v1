"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableHead, TableRow, Th, Td } from "@/components/ui/Table";
import { ExportWorkbookButton } from "@/components/ui/ExportButton";
import { useTaskReport } from "@/hooks/use-tasks";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { buildSheet, type ExportColumn, type PreparedSheet } from "@/lib/export";
import type { TaskPeriodStats, TaskReport } from "@/lib/api";

type Preset = "this_month" | "last_month" | "last_30" | "custom";

const iso = (d: Date) => d.toISOString().slice(0, 10);

function periodFor(preset: Preset, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  const today = iso(now);
  if (preset === "last_month") {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    return { from: iso(first), to: iso(last) };
  }
  if (preset === "last_30") return { from: iso(new Date(now.getTime() - 29 * 86_400_000)), to: today };
  if (preset === "custom") return { from: customFrom || today, to: customTo || today };
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

/** "+3", "-2", or "—" when there is nothing to compare. Colour says whether the change is good. */
function Delta({ now, before, lowerIsBetter = false, suffix = "" }: { now: number | null; before: number | null; lowerIsBetter?: boolean; suffix?: string }) {
  if (now === null || before === null) return <span className="text-xs text-(--muted)">no comparison</span>;
  const diff = Math.round((now - before) * 10) / 10;
  if (diff === 0) return <span className="text-xs text-(--muted)">same as before</span>;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span className={`text-xs font-medium ${good ? "text-(--success)" : "text-(--destructive)"}`}>
      {diff > 0 ? "+" : ""}
      {diff}
      {suffix} vs previous period
    </span>
  );
}

function Tile({ label, value, children, tone }: { label: string; value: string; children?: React.ReactNode; tone?: "danger" }) {
  return (
    <div className="rounded-xl border border-(--card-border) bg-(--card) px-4 py-3">
      <p className="text-xs text-(--muted)">{label}</p>
      <p className={`num mt-0.5 text-2xl font-semibold ${tone === "danger" ? "text-(--destructive)" : "text-(--foreground)"}`}>{value}</p>
      {children && <div className="mt-0.5">{children}</div>}
    </div>
  );
}

const pct = (n: number | null) => (n === null ? "—" : `${n}%`);
const days = (n: number | null) => (n === null ? "—" : `${n} d`);

type SummaryRow = { metric: string; current: number | null; before: number | null };
const summaryColumns: ExportColumn<SummaryRow>[] = [
  { header: "Metric", value: (r) => r.metric, width: 32 },
  { header: "This period", value: (r) => r.current, kind: "number", width: 14 },
  { header: "Previous period", value: (r) => r.before, kind: "number", width: 16 },
];
const peopleColumns: ExportColumn<TaskReport["people"][number]>[] = [
  { header: "Person", value: (r) => r.name, width: 24 },
  { header: "Open", value: (r) => r.open, kind: "number" },
  { header: "Overdue", value: (r) => r.overdue, kind: "number" },
  { header: "Blocked", value: (r) => r.blocked, kind: "number" },
  { header: "Completed in period", value: (r) => r.completed, kind: "number", width: 18 },
  { header: "On-time %", value: (r) => r.onTimeRate, kind: "number" },
  { header: "Avg days to complete", value: (r) => r.avgDays, kind: "number", width: 20 },
];
const projectColumns: ExportColumn<TaskReport["projects"][number]>[] = [
  { header: "Project", value: (r) => r.title, width: 32 },
  { header: "Open", value: (r) => r.open, kind: "number" },
  { header: "Overdue", value: (r) => r.overdue, kind: "number" },
  { header: "Completed in period", value: (r) => r.completed, kind: "number", width: 18 },
];
const postponedColumns: ExportColumn<TaskReport["rescheduled"][number]>[] = [
  { header: "Task", value: (r) => r.title, width: 36 },
  { header: "Assignee", value: (r) => r.assignee_name, width: 20 },
  { header: "Times postponed", value: (r) => r.count, kind: "number", width: 16 },
  { header: "Current due date", value: (r) => r.due_date },
  { header: "Status", value: (r) => r.status.replace("_", " ") },
];

function sheetsFor(report: TaskReport): PreparedSheet[] {
  const c: TaskPeriodStats = report.current;
  const b: TaskPeriodStats = report.before;
  const summary: SummaryRow[] = [
    { metric: "Tasks created", current: c.created, before: b.created },
    { metric: "Tasks completed", current: c.completed, before: b.completed },
    { metric: "Finished on time (%)", current: c.onTimeRate, before: b.onTimeRate },
    { metric: "Average days to complete", current: c.avgDays, before: b.avgDays },
    { metric: "Open now", current: report.snapshot.open, before: null },
    { metric: "Overdue now", current: report.snapshot.overdue, before: null },
    { metric: "Blocked now", current: report.snapshot.blocked, before: null },
  ];
  return [
    buildSheet("Summary", summaryColumns, summary),
    buildSheet("By person", peopleColumns, report.people),
    buildSheet("By project", projectColumns, report.projects),
    buildSheet("Postponed most", postponedColumns, report.rescheduled),
  ];
}

export default function TaskReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [preset, setPreset] = useState<Preset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const period = useMemo(() => periodFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const validCustom = preset !== "custom" || (customFrom && customTo && customFrom <= customTo);
  const { data, isLoading, error } = useTaskReport(validCustom ? period : { from: undefined, to: undefined });

  if (!can(user, "taskAdmin")) {
    return <p className="py-10 text-center text-(--muted)">The team report is for managers and above.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={() => router.push("/dashboard/tasks")} className="mb-1 flex items-center gap-1 text-sm text-(--muted) hover:text-(--foreground)">
            <ArrowLeft className="h-4 w-4" /> Tasks
          </button>
          <h1 className="text-2xl font-bold text-foreground">Team task report</h1>
          <p className="mt-1 text-(--muted)">
            {data ? `${data.period.from} to ${data.period.to}, compared with ${data.previous.from} to ${data.previous.to}` : "How the work is going"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Select
              label="Period"
              options={[
                { value: "this_month", label: "This month" },
                { value: "last_month", label: "Last month" },
                { value: "last_30", label: "Last 30 days" },
                { value: "custom", label: "Custom" },
              ]}
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
            />
          </div>
          {preset === "custom" && (
            <>
              <Input type="date" label="From" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <Input type="date" label="To" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          )}
          {data && <ExportWorkbookButton filename={`task-report-${data.period.from}-to-${data.period.to}`} buildSheets={async () => sheetsFor(data)} />}
        </div>
      </div>

      {preset === "custom" && !validCustom && <p className="text-sm text-(--muted)">Pick both dates (from on or before to).</p>}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
        </div>
      ) : error || !data ? (
        <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">
          Couldn&apos;t load the report. If you just updated the app, make sure the backend has been deployed too.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Tasks created" value={String(data.current.created)}>
              <Delta now={data.current.created} before={data.before.created} />
            </Tile>
            <Tile label="Tasks completed" value={String(data.current.completed)}>
              <Delta now={data.current.completed} before={data.before.completed} />
            </Tile>
            <Tile label="Finished on time" value={pct(data.current.onTimeRate)}>
              <Delta now={data.current.onTimeRate} before={data.before.onTimeRate} suffix=" pts" />
            </Tile>
            <Tile label="Avg time to complete" value={days(data.current.avgDays)}>
              <Delta now={data.current.avgDays} before={data.before.avgDays} lowerIsBetter suffix=" d" />
            </Tile>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Tile label="Open now" value={String(data.snapshot.open)} />
            <Tile label="Overdue now" value={String(data.snapshot.overdue)} tone={data.snapshot.overdue > 0 ? "danger" : undefined} />
            <Tile label="Blocked now" value={String(data.snapshot.blocked)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>By person</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.people.length === 0 ? (
                <p className="py-6 text-center text-(--muted)">No task activity in this period.</p>
              ) : (
                <Table>
                  <TableHead>
                    <Th>Person</Th>
                    <Th>Open</Th>
                    <Th>Overdue</Th>
                    <Th>Completed</Th>
                    <Th>On time</Th>
                    <Th>Avg days</Th>
                  </TableHead>
                  <TableBody>
                    {data.people.map((p) => (
                      <TableRow key={p.user_id ?? "none"}>
                        <Td label="Person" className="font-medium text-foreground">{p.name}</Td>
                        <Td label="Open" className="num">{p.open}</Td>
                        <Td label="Overdue" className={`num ${p.overdue > 0 ? "font-medium text-(--destructive)" : "text-(--muted)"}`}>{p.overdue}</Td>
                        <Td label="Completed" className="num">{p.completed}</Td>
                        <Td label="On time" className="num text-(--muted)">{pct(p.onTimeRate)}</Td>
                        <Td label="Avg days" className="num text-(--muted)">{days(p.avgDays)}</Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By project</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.projects.length === 0 ? (
                  <p className="py-6 text-center text-(--muted)">Nothing here yet.</p>
                ) : (
                  <Table>
                    <TableHead>
                      <Th>Project</Th>
                      <Th>Open</Th>
                      <Th>Overdue</Th>
                      <Th>Done</Th>
                    </TableHead>
                    <TableBody>
                      {data.projects.map((p) => (
                        <TableRow key={p.project_id ?? "internal"}>
                          <Td label="Project" className="font-medium text-foreground">{p.title}</Td>
                          <Td label="Open" className="num">{p.open}</Td>
                          <Td label="Overdue" className={`num ${p.overdue > 0 ? "font-medium text-(--destructive)" : "text-(--muted)"}`}>{p.overdue}</Td>
                          <Td label="Done" className="num">{p.completed}</Td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Postponed most</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.rescheduled.length === 0 ? (
                  <p className="py-6 text-center text-(--muted)">No due date was pushed back in this period.</p>
                ) : (
                  <ul className="divide-y divide-(--border-subtle)">
                    {data.rescheduled.map((r) => (
                      <li key={r.task_id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
                          <span className="block text-xs text-(--muted)">
                            {r.assignee_name ?? "Unassigned"} · {r.status.replace("_", " ")}
                          </span>
                        </span>
                        <span className="num shrink-0 text-sm font-semibold text-(--warning)">{r.count}×</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-(--muted)">
            Created and completed count tasks by the date they were created or finished. On time = finished on or before the due date (only tasks that had one). Average time runs from creation to completion. Sub-tasks are
            not counted separately.
          </p>
        </>
      )}
    </div>
  );
}
