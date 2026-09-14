"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProject, useProjectPayments } from "@/hooks/use-projects";
import { usePhases, useDeletePhase } from "@/hooks/use-phases";
import { useInvoices } from "@/hooks/use-invoices";
import { useProjectProfitability } from "@/hooks/use-statistics";
import { useFeedback } from "@/hooks/use-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { GanttChart } from "@/components/tasks/GanttChart";
import { ProjectTeamTab } from "@/components/team/ProjectTeamTab";
import { MeetingsTab } from "@/components/meetings/MeetingsTab";
import { ProjectLinksTab } from "@/components/projects/ProjectLinksTab";
import { CredentialsTab } from "@/components/credentials/CredentialsTab";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import { PhaseFormModal } from "./PhaseFormModal";
import { TaskFormModal } from "./TaskFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InvoiceFormModal } from "@/app/dashboard/invoices/InvoiceFormModal";
import { invoiceStatusVariant } from "@/lib/status-badges";
import type { Task } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading, error } = useProject(id);
  const { data: paymentsData } = useProjectPayments(id);
  const { data: phasesData } = usePhases(id, { page: 1, limit: 100 });
  const { data: invoicesData } = useInvoices({ project_id: id, limit: 100 });
  const { data: profitability } = useProjectProfitability(id);
  const { data: feedbackData } = useFeedback(id);
  const deletePhase = useDeletePhase(id);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-lg border border-[var(--destructive)] bg-red-50 p-4 text-[var(--destructive)]">
        Project not found.
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={() => router.push("/dashboard/projects")}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const payments = paymentsData?.payments ?? [];
  const phases = phasesData?.phases ?? [];
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = (project.price ?? 0) - totalPaid;

  const openTask = (task: Task) => {
    setOpenTaskId(task.id);
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <p className="mt-1 text-sm capitalize text-[var(--muted)]">
            {project.status.replace("_", " ")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.details && (
            <p className="text-[var(--foreground)]">{project.details}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            {project.start_date && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--muted)]" />
                Start: {project.start_date}
              </span>
            )}
            {project.due_date && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--muted)]" />
                Due: {project.due_date}
              </span>
            )}
            {project.price != null && (
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[var(--muted)]" />
                Price: {formatMoney(project.price)}
              </span>
            )}
            {feedbackData && feedbackData.feedback.length > 0 && (
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-(--warning) text-(--warning)" />
                {feedbackData.averageRating.toFixed(1)} avg. client feedback ({feedbackData.feedback.length})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Tabs
            tabs={[
              {
                key: "tasks",
                label: "Tasks",
                content: (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpenTaskId(null);
                          setTaskModalOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add task
                      </Button>
                    </div>
                    <KanbanBoard projectId={id} onOpenTask={openTask} />
                  </div>
                ),
              },
              {
                key: "timeline",
                label: "Timeline",
                content: <GanttChart projectId={id} />,
              },
              {
                key: "team",
                label: "Team",
                content: <ProjectTeamTab projectId={id} />,
              },
              {
                key: "meetings",
                label: "Meetings",
                content: <MeetingsTab projectId={id} clientId={project.client_id} />,
              },
              {
                key: "links",
                label: "Links",
                content: <ProjectLinksTab projectId={id} />,
              },
              {
                key: "phases",
                label: "Phases",
                content: (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingPhaseId(null);
                          setPhaseModalOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add phase
                      </Button>
                    </div>
                    {phases.length === 0 ? (
                      <p className="text-[var(--muted)]">No phases yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {phases.map((ph) => (
                          <li
                            key={ph.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-medium">{ph.title}</span>
                              <span className="mx-2 text-[var(--muted)]">·</span>
                              <span>
                                {ph.start_date} – {ph.end_date}
                              </span>
                              <span className="mx-2 text-[var(--muted)]">·</span>
                              <span className="font-medium">{formatMoney(ph.amount)}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingPhaseId(ph.id);
                                  setPhaseModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeletingPhaseId(ph.id)}>
                                <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ),
              },
              {
                key: "invoices",
                label: "Invoices",
                content: (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setInvoiceModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New invoice
                      </Button>
                    </div>
                    {!invoicesData?.invoices?.length ? (
                      <p className="text-[var(--muted)]">No invoices yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {invoicesData.invoices.map((inv) => (
                          <li key={inv.id}>
                            <Link
                              href={`/dashboard/invoices/${inv.id}`}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm transition-colors hover:bg-sky-50/60"
                            >
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{inv.invoice_number}</span>
                                <Badge variant={invoiceStatusVariant[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                              </span>
                              <span className="font-medium">{formatMoney(inv.total_amount)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ),
              },
              {
                key: "credentials",
                label: "Credentials",
                content: <CredentialsTab projectId={id} />,
              },
              {
                key: "payments",
                label: "Payments",
                content: (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--muted)]">
                      Total paid: {formatMoney(totalPaid)} · Remaining: {formatMoney(remaining)}
                    </p>
                    {payments.length === 0 ? (
                      <p className="text-[var(--muted)]">No payments yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {payments.map((p) => (
                          <li
                            key={p.id}
                            className="flex justify-between rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm"
                          >
                            <span>
                              {p.payment_date} · {p.payment_method.replace("_", " ")}
                            </span>
                            <span className="font-medium">{formatMoney(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={`/dashboard/payments?project_id=${project.id}`}>
                      <Button variant="secondary" size="sm">
                        View all payments
                      </Button>
                    </Link>
                  </div>
                ),
              },
              ...(profitability && "grossProfit" in profitability
                ? [
                    {
                      key: "profitability",
                      label: "Profitability",
                      content: (
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-sm text-[var(--muted)]">Recognized revenue</p>
                            <p className="text-lg font-semibold">{formatMoney(profitability.recognizedRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-[var(--muted)]">Total cost</p>
                            <p className="text-lg font-semibold">{formatMoney(profitability.totalCost)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-[var(--muted)]">Gross profit</p>
                            <p className="text-lg font-semibold text-[var(--primary)]">
                              {formatMoney(profitability.grossProfit)} ({profitability.grossMargin}%)
                            </p>
                          </div>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </CardContent>
      </Card>

      <InvoiceFormModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        defaultProjectId={id}
      />

      <PhaseFormModal
        open={phaseModalOpen}
        onClose={() => {
          setPhaseModalOpen(false);
          setEditingPhaseId(null);
        }}
        projectId={id}
        phaseId={editingPhaseId}
      />

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setOpenTaskId(null);
        }}
        projectId={id}
        clientId={project.client_id}
        taskId={openTaskId}
      />

      <ConfirmDialog
        open={!!deletingPhaseId}
        title="Delete phase?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deletePhase.isPending}
        onClose={() => setDeletingPhaseId(null)}
        onConfirm={() => {
          if (!deletingPhaseId) return;
          deletePhase.mutate(deletingPhaseId, {
            onSuccess: () => setDeletingPhaseId(null),
          });
        }}
      />
    </div>
  );
}
