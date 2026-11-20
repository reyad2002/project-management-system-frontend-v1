"use client";

import { useState } from "react";
import { KanbanSquare, LayoutTemplate, List, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskDetailModal, isOverdue } from "@/components/tasks/TaskDetailModal";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { ApplyTemplateModal } from "@/components/tasks/ApplyTemplateModal";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { useAllTasks, useSetAnyTaskStatus } from "@/hooks/use-tasks";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { taskPriorityVariant, taskStatusVariant } from "@/lib/status-badges";
import { CheckCircle2, Circle } from "lucide-react";

const OPEN = "todo,in_progress,in_review,blocked";

interface ProjectTasksPanelProps {
  projectId: string;
  projectStartDate?: string | null;
  projectType?: string;
}

/** The project page's own task list: the same list/board as Tasks, filtered to this project. */
export function ProjectTasksPanel({ projectId, projectStartDate, projectType }: ProjectTasksPanelProps) {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "board">("list");
  const [showDone, setShowDone] = useState(false);
  const [creating, setCreating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const setStatus = useSetAnyTaskStatus();

  const { data: openData, isLoading } = useAllTasks({ project_id: projectId, status: OPEN, limit: 200 });
  const { data: doneData } = useAllTasks({ project_id: projectId, status: "done", sort: "completed", limit: 50 });

  const open = openData?.tasks ?? [];
  const done = doneData?.tasks ?? [];
  const doneTotal = doneData?.total ?? 0;
  const total = (openData?.total ?? 0) + doneTotal;
  const percent = total === 0 ? 0 : Math.round((doneTotal / total) * 100);

  const rows = showDone ? [...open, ...done] : open;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {total > 0 ? (
            <div className="flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-(--muted-bg)" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-(--primary)" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-sm text-(--muted)">
                <span className="num font-medium text-(--foreground)">{doneTotal}</span> of <span className="num">{total}</span> done ({percent}%)
              </p>
            </div>
          ) : (
            <p className="text-sm text-(--muted)">No tasks on this project yet.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-(--muted-bg) p-1">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${view === v ? "bg-(--card) text-(--foreground) shadow-sm" : "text-(--muted) hover:text-(--foreground)"}`}
              >
                {v === "list" ? <List className="h-4 w-4" /> : <KanbanSquare className="h-4 w-4" />}
                {v === "list" ? "List" : "Board"}
              </button>
            ))}
          </div>
          {can(user, "taskAdmin") && (
            <Button size="sm" variant="outline" onClick={() => setApplying(true)}>
              <LayoutTemplate className="me-2 h-4 w-4" />
              Apply template
            </Button>
          )}
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="me-2 h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

      {view === "list" && <QuickAddTask projectId={projectId} />}

      {isLoading ? (
        <p className="py-6 text-center text-(--muted)">Loading tasks...</p>
      ) : view === "board" ? (
        total === 0 ? (
          <p className="py-6 text-center text-(--muted)">No tasks yet. Add one, or apply a template to start from a ready list.</p>
        ) : (
          <TasksBoard tasks={open} doneTasks={done.slice(0, 20)} onOpenTask={setOpenId} />
        )
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-(--muted)">
          {total > 0 ? "Everything is done." : "No tasks yet. Add one, or apply a template to start from a ready list."}
        </p>
      ) : (
        <ul className="divide-y divide-(--border-subtle) rounded-xl border border-(--card-border)">
          {rows.map((t) => {
            const isDone = t.status === "done";
            const who = t.assignee_type === "client" ? t.client_assignee_name : t.assignee_name;
            return (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-(--muted-bg)/50">
                <button
                  type="button"
                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                  onClick={() => setStatus.mutate({ id: String(t.id), status: isDone ? "todo" : "done" })}
                  className="shrink-0 text-(--muted) hover:text-(--primary)"
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5 text-(--success)" /> : <Circle className="h-5 w-5" />}
                </button>
                <button type="button" onClick={() => setOpenId(String(t.id))} className="min-w-0 flex-1 text-start">
                  <p className={`truncate text-sm font-medium ${isDone ? "text-(--muted) line-through" : "text-(--foreground)"}`}>
                    {t.title}
                    {t.recurring_task_id && <Repeat className="ms-1.5 inline h-3.5 w-3.5 text-(--muted)" aria-label="Recurring task" />}
                  </p>
                  <p className="truncate text-xs text-(--muted)">
                    {who ?? "Unassigned"}
                    {t.checklist_progress.total > 0 && ` · ${t.checklist_progress.done}/${t.checklist_progress.total} checklist`}
                  </p>
                </button>
                <Badge variant={taskPriorityVariant[t.priority]} dot={false} className="hidden sm:inline-flex">
                  {t.priority}
                </Badge>
                <Badge variant={taskStatusVariant[t.status]} className="hidden sm:inline-flex">
                  {t.status.replace("_", " ")}
                </Badge>
                <span className={`num w-24 shrink-0 text-end text-xs ${isOverdue(t) ? "font-medium text-(--destructive)" : "text-(--muted)"}`}>{t.due_date ?? "—"}</span>
              </li>
            );
          })}
        </ul>
      )}

      {view === "list" && doneTotal > 0 && (
        <button type="button" onClick={() => setShowDone((v) => !v)} className="text-sm font-medium text-(--primary) hover:underline">
          {showDone ? "Hide completed" : `Show completed (${doneTotal})`}
        </button>
      )}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} defaultProjectId={projectId} lockProject onSaved={(t) => setOpenId(String(t.id))} />
      <ApplyTemplateModal open={applying} onClose={() => setApplying(false)} projectId={projectId} projectStartDate={projectStartDate} projectType={projectType} />
      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} onOpenTask={setOpenId} />
    </div>
  );
}
