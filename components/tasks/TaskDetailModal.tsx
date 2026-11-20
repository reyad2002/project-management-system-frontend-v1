"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ChecklistPanel } from "@/components/tasks/ChecklistPanel";
import { SubtaskList } from "@/components/tasks/SubtaskList";
import { DependenciesPanel } from "@/components/tasks/DependenciesPanel";
import { TaskLinksPanel } from "@/components/tasks/TaskLinksPanel";
import { CommentsPanel } from "@/components/tasks/CommentsPanel";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { useTask, useSetAnyTaskStatus, useDeleteTasksWithUndo, useCreateAnyTask } from "@/hooks/use-tasks";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { TASK_STATUSES } from "@/lib/constants";
import { taskPriorityVariant, taskStatusVariant } from "@/lib/status-badges";
import type { Task, TaskStatus } from "@/lib/api";

interface TaskDetailModalProps {
  /** Task to show, or null to keep the modal closed. */
  taskId: string | null;
  onClose: () => void;
  /** Switch to another task (opening a sub-task, or going back to its parent). */
  onOpenTask: (id: string) => void;
}

export function isOverdue(task: Pick<Task, "due_date" | "status">): boolean {
  return !!task.due_date && task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-(--muted)">{label}</p>
      <div className="mt-0.5 text-sm text-(--foreground)">{children}</div>
    </div>
  );
}

export function TaskDetailModal({ taskId, onClose, onOpenTask }: TaskDetailModalProps) {
  const { data: task, isLoading, isError } = useTask(taskId);
  const setStatus = useSetAnyTaskStatus();
  const deleteWithUndo = useDeleteTasksWithUndo();
  const duplicate = useCreateAnyTask();
  const { data: notifications } = useNotifications({ limit: 10 });
  const { mutate: markRead } = useMarkNotificationRead();

  // Opening a task reads its notifications (no need to clear them again from the bell).
  useEffect(() => {
    if (!taskId) return;
    for (const n of notifications?.notifications ?? []) {
      if (!n.is_read && n.related_type === "task" && String(n.related_id) === String(taskId)) markRead(n.id);
    }
  }, [taskId, notifications, markRead]);
  const [editing, setEditing] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);

  if (!taskId) return null;

  const assignee = task ? (task.assignee_type === "client" ? task.client_assignee_name : task.assignee_name) : null;
  const overdue = task ? isOverdue(task) : false;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={task?.title ?? "Task"}
        size="lg"
        footer={
          <>
            {task && (
              <Button
                type="button"
                variant="ghost"
                className="me-auto text-(--destructive)"
                onClick={() => {
                  deleteWithUndo([{ id: String(task.id), title: task.title }]);
                  onClose();
                }}
              >
                <Trash2 className="me-2 h-4 w-4" />
                Delete
              </Button>
            )}
            {task && !task.parent_task_id && (
              <Button
                type="button"
                variant="ghost"
                loading={duplicate.isPending}
                onClick={() =>
                  duplicate.mutate(
                    {
                      title: `${task.title} (copy)`,
                      description: task.description ?? undefined,
                      project_id: task.project_id,
                      priority: task.priority,
                      status: "todo",
                      assignee_id: task.assignee_type === "team_member" ? task.assignee_id : null,
                      start_date: task.start_date,
                      due_date: task.due_date,
                    },
                    { onSuccess: (copy) => onOpenTask(String(copy.id)) },
                  )
                }
              >
                <Copy className="me-2 h-4 w-4" />
                Duplicate
              </Button>
            )}
            {task && (
              <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="me-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          </>
        }
      >
        {isLoading ? (
          <p className="text-(--muted)">Loading...</p>
        ) : isError || !task ? (
          <p className="text-(--muted)">This task isn&apos;t available — it may have been deleted, or it isn&apos;t yours to see.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={taskStatusVariant[task.status]}>{task.status.replace("_", " ")}</Badge>
              <Badge variant={taskPriorityVariant[task.priority]} dot={false}>
                {task.priority}
              </Badge>
              {task.source === "meeting" && (
                <Badge variant="info" dot={false}>
                  From meeting
                </Badge>
              )}
              {overdue && <Badge variant="danger" dot={false}>Overdue</Badge>}
            </div>

            {task.description && <p className="whitespace-pre-wrap text-sm text-(--foreground)">{task.description}</p>}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Project">
                {task.project_id ? (
                  <Link href={`/dashboard/projects/${task.project_id}`} className="text-(--primary) hover:underline">
                    {task.project_title ?? "Open project"}
                  </Link>
                ) : (
                  <span className="text-(--muted)">Internal</span>
                )}
              </Field>
              <Field label="Assignee">{assignee ?? <span className="text-(--muted)">Unassigned</span>}</Field>
              <Field label="Due">
                {task.due_date ? <span className={overdue ? "font-medium text-(--destructive)" : ""}>{task.due_date}</span> : <span className="text-(--muted)">No date</span>}
              </Field>
              {task.start_date && <Field label="Start">{task.start_date}</Field>}
              {task.completed_at && <Field label="Completed">{task.completed_at.slice(0, 10)}</Field>}
            </div>

            <CustomSelect
              label="Move to"
              options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              value={task.status}
              onChange={(v) => {
                if (v !== task.status) setStatus.mutate({ id: task.id, status: v as TaskStatus });
              }}
            />

            <ChecklistPanel taskId={task.id} />

            {task.parent_task_id ? (
              <button type="button" onClick={() => onOpenTask(String(task.parent_task_id))} className="text-sm font-medium text-(--primary) hover:underline">
                ← Back to the main task
              </button>
            ) : (
              <SubtaskList taskId={task.id} onAddSubtask={() => setAddingSubtask(true)} onOpenSubtask={(st) => onOpenTask(String(st.id))} />
            )}

            <DependenciesPanel task={task} />
            <TaskLinksPanel taskId={String(task.id)} />
            <CommentsPanel taskId={String(task.id)} />
          </div>
        )}
      </Modal>

      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={task ?? null} />
      <TaskFormModal open={addingSubtask} onClose={() => setAddingSubtask(false)} parentTask={task ?? null} />

    </>
  );
}
