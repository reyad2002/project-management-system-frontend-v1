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
import { MeetingsTab } from "@/components/meetings/MeetingsTab";
import { ProjectTasksPanel } from "@/components/tasks/ProjectTasksPanel";
import { ProjectLinksTab } from "@/components/projects/ProjectLinksTab";
import { CredentialsTab } from "@/components/credentials/CredentialsTab";
import { FilesTab } from "@/components/files/FilesTab";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { ProjectReportsTab } from "@/components/reports/ProjectReportsTab";
import { hasReports } from "@/components/reports/reportMetrics";
import { PROJECT_TYPES, BILLING_MODELS } from "@/lib/constants";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InvoiceFormModal } from "@/app/dashboard/invoices/InvoiceFormModal";
import { ProjectFormModal } from "@/app/dashboard/projects/ProjectFormModal";
import { useClientsShortList } from "@/hooks/use-clients";
import { PaymentFormModal } from "@/app/dashboard/payments/PaymentFormModal";
import { ExpenseFormModal } from "@/app/dashboard/expenses/ExpenseFormModal";
import { togglePin, usePinnedProjects } from "@/lib/local-lists";
import { ProjectWrapUp } from "@/components/projects/ProjectWrapUp";
import { invoiceStatusVariant } from "@/lib/status-badges";

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
  const { user } = useAuth();
  const financeAllowed = can(user, "finance");
  const credentialsAllowed = can(user, "credentials");
  const { data: project, isLoading, error } = useProject(id);
  const { data: paymentsData } = useProjectPayments(financeAllowed ? id : null);
  const { data: phasesData } = usePhases(id, { page: 1, limit: 100 });
  const { data: invoicesData } = useInvoices({ project_id: id, limit: 100 }, { enabled: financeAllowed });
  const { data: profitability } = useProjectProfitability(financeAllowed ? id : undefined);
  const { data: feedbackData } = useFeedback(id);
  const deletePhase = useDeletePhase(id);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const pins = usePinnedProjects(user?.id);
  const pinned = pins.some((p) => String(p.id) === String(id));
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { data: clientsData } = useClientsShortList();

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
          className="ms-4"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={pinned}
            title={pinned ? "Remove from the sidebar" : "Keep in the sidebar for quick access"}
            onClick={() => togglePin(user?.id, { id, title: project.title })}
          >
            <Star className={`me-2 h-4 w-4 ${pinned ? "fill-current text-(--warning)" : ""}`} />
            {pinned ? "Pinned" : "Pin"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="me-2 h-4 w-4" />
            Edit project
          </Button>
        </div>
      </div>

      <ProjectWrapUp projectId={id} status={project.status} remaining={financeAllowed ? remaining : null} />

      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span className="capitalize">{project.status.replace("_", " ")}</span>
            <Badge variant="info" dot={false}>
              {PROJECT_TYPES.find((t) => t.value === project.type)?.label ?? project.type}
            </Badge>
            {project.billing_model !== "fixed" && (
              <Badge variant="neutral" dot={false}>
                {BILLING_MODELS.find((b) => b.value === project.billing_model)?.label}
              </Badge>
            )}
          </div>
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
                {project.billing_model === "retainer" ? "Monthly fee" : "Price"}: {formatMoney(project.price)}
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
                content: <ProjectTasksPanel projectId={id} projectStartDate={project.start_date} projectType={project.type} />,
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
                key: "files",
                label: "Files",
                content: <FilesTab projectId={id} />,
              },
              ...(hasReports(project.type)
                ? [
                    {
                      key: "reports",
                      label: "Reports",
                      content: <ProjectReportsTab projectId={id} projectType={project.type} projectTitle={project.title} />,
                    },
                  ]
                : []),
              ...(project.billing_model !== "retainer"
                ? [{
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
                        <Plus className="me-2 h-4 w-4" />
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
              }]
                : []),
              ...(financeAllowed
                ? [{
                key: "invoices",
                label: "Invoices",
                content: (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setInvoiceModalOpen(true)}>
                        <Plus className="me-2 h-4 w-4" />
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
              }]
                : []),
              ...(credentialsAllowed
                ? [{
                key: "credentials",
                label: "Credentials",
                content: <CredentialsTab projectId={id} />,
              }]
                : []),
              ...(financeAllowed
                ? [{
                key: "payments",
                label: "Payments",
                content: (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[var(--muted)]">
                        Total paid: {formatMoney(totalPaid)} · Remaining: {formatMoney(remaining)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setExpenseModalOpen(true)}>
                          <Plus className="me-2 h-4 w-4" />
                          Add expense
                        </Button>
                        <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                          <Plus className="me-2 h-4 w-4" />
                          Add payment
                        </Button>
                      </div>
                    </div>
                    {payments.length === 0 ? (
                      <p className="text-[var(--muted)]">No payments yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {payments.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm"
                          >
                            <span>
                              {p.payment_date} · {p.payment_method.replace("_", " ")}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-medium">{formatMoney(p.amount)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Edit payment"
                                onClick={() => {
                                  setEditingPaymentId(p.id);
                                  setPaymentModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </span>
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
              }]
                : []),
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
                          {profitability.adBudget > 0 && (
                            <>
                              <div>
                                <p className="text-sm text-[var(--muted)]">Client ad budget</p>
                                <p className="text-lg font-semibold">{formatMoney(profitability.adBudget)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[var(--muted)]">Ad spend so far</p>
                                <p className="text-lg font-semibold">{formatMoney(profitability.adSpend)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[var(--muted)]">
                                  {(profitability.adBudgetRemaining ?? 0) < 0 ? "Overspent vs budget" : "Unspent client budget"}
                                </p>
                                <p className="text-lg font-semibold">
                                  {formatMoney(Math.abs(profitability.adBudgetRemaining ?? 0))}
                                </p>
                              </div>
                            </>
                          )}
                          {profitability.budgetedCost != null && (
                            <div className="space-y-1.5 sm:col-span-3">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-sm text-[var(--muted)]">Budget vs actual cost</p>
                                <p className="text-sm">
                                  <span className="font-semibold">{formatMoney(profitability.totalCost)}</span>
                                  <span className="text-[var(--muted)]"> of {formatMoney(profitability.budgetedCost)} ({profitability.budgetPercent}%)</span>
                                </p>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-(--muted-bg)" role="progressbar" aria-valuenow={Math.min(100, profitability.budgetPercent ?? 0)} aria-valuemin={0} aria-valuemax={100}>
                                <div
                                  className={`h-full rounded-full ${profitability.budgetLevel === "over" ? "bg-(--destructive)" : profitability.budgetLevel === "warn" ? "bg-(--warning)" : "bg-(--success)"}`}
                                  style={{ width: `${Math.min(100, profitability.budgetPercent ?? 0)}%` }}
                                />
                              </div>
                              <p className={`text-xs ${profitability.budgetLevel === "over" ? "font-medium text-(--destructive)" : "text-(--muted)"}`}>
                                {(profitability.budgetVariance ?? 0) < 0
                                  ? `Over budget by ${formatMoney(Math.abs(profitability.budgetVariance ?? 0))}`
                                  : `${formatMoney(profitability.budgetVariance ?? 0)} left in the budget`}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-[var(--muted)] sm:col-span-3">
                            Revenue basis: {profitability.revenueBasis === "invoices" ? "invoices issued" : "payments received (no invoices on this project)"}.
                            Advances and equipment are not counted as project costs.
                          </p>
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

      <ExpenseFormModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} expenseId={null} defaultProjectId={id} />

      <PaymentFormModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setEditingPaymentId(null);
        }}
        paymentId={editingPaymentId}
        defaultProjectId={id}
      />

      <ProjectFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        projectId={id}
        clientOptions={(clientsData?.clients ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
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
