"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, TableBody, TableHead, TableRow, TableSkeletonRows, Td, Th } from "@/components/ui/Table";
import { RecurringTaskFormModal } from "@/components/tasks/RecurringTaskFormModal";
import { useDeleteRecurringTask, useRecurringTasks, useToggleRecurringTask } from "@/hooks/use-task-templates";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import type { RecurringTask } from "@/lib/api";

type Editing = { rule: RecurringTask | null } | null;

function nextLabel(r: RecurringTask) {
  if (r.status === "paused") return "Paused";
  if (r.ended) return "Ended";
  return r.next_run_date;
}

export default function RecurringTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useRecurringTasks();
  const toggle = useToggleRecurringTask();
  const remove = useDeleteRecurringTask();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<RecurringTask | null>(null);

  if (!can(user, "taskAdmin")) {
    return <p className="py-10 text-center text-(--muted)">Recurring tasks are managed by managers and above.</p>;
  }

  const rules = data?.recurringTasks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={() => router.push("/dashboard/tasks")} className="mb-1 flex items-center gap-1 text-sm text-(--muted) hover:text-(--foreground)">
            <ArrowLeft className="h-4 w-4" /> Tasks
          </button>
          <h1 className="text-2xl font-bold text-foreground">Recurring tasks</h1>
          <p className="mt-1 text-(--muted)">Tasks that create themselves on a schedule: the monthly report, the weekly post, the daily check.</p>
        </div>
        <Button onClick={() => setEditing({ rule: null })}>
          <Plus className="me-2 h-4 w-4" />
          New recurring task
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Table>
              <TableHead>
                <Th>Task</Th>
                <Th>Repeats</Th>
                <Th>Next</Th>
                <Th>Assignee</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                <TableSkeletonRows columns={5} />
              </TableBody>
            </Table>
          ) : rules.length === 0 ? (
            <p className="py-8 text-center text-(--muted)">Nothing recurring yet. Add the work that comes round every week or month.</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Task</Th>
                <Th>Repeats</Th>
                <Th>Next</Th>
                <Th>Assignee</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <Td label="Task">
                      <p className={`font-medium ${r.status === "paused" ? "text-(--muted)" : "text-foreground"}`}>{r.title}</p>
                      <p className="text-xs text-(--muted)">
                        {r.project_title ?? "Internal"} · due {r.due_in_days === 0 ? "the same day" : `${r.due_in_days} day${r.due_in_days > 1 ? "s" : ""} after`}
                      </p>
                    </Td>
                    <Td label="Repeats" className="text-(--muted)">{r.schedule}</Td>
                    <Td label="Next">
                      {r.status === "paused" || r.ended ? <Badge variant="neutral" dot={false}>{nextLabel(r)}</Badge> : <span className="num">{r.next_run_date}</span>}
                    </Td>
                    <Td label="Assignee" className="text-(--muted)">{r.assignee_name ?? "—"}</Td>
                    <Td align="right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={r.status === "paused" ? "Resume" : "Pause"}
                          title={r.status === "paused" ? "Resume" : "Pause"}
                          onClick={() => toggle.mutate({ id: r.id, status: r.status === "paused" ? "active" : "paused" })}
                        >
                          {r.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => setEditing({ rule: r })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-(--destructive)" aria-label="Delete" onClick={() => setDeleting(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && <RecurringTaskFormModal key={editing.rule?.id ?? "new"} rule={editing.rule} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!deleting}
        title={`Stop "${deleting?.title}"?`}
        description="No more tasks will be created from it. Tasks it already created stay."
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
