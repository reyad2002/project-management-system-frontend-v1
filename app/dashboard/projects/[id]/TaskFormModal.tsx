"use client";

import { useId, useState } from "react";
import { useTask, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { TaskForm, type TaskFormData } from "@/components/tasks/TaskForm";
import { ChecklistPanel } from "@/components/tasks/ChecklistPanel";
import { SubtaskList } from "@/components/tasks/SubtaskList";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task } from "@/lib/api";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  clientId: string;
  taskId: string | null;
  defaultParentTaskId?: string | null;
}

export function TaskFormModal({ open, onClose, projectId, clientId, taskId, defaultParentTaskId }: TaskFormModalProps) {
  const formId = `task-form-${useId()}`;
  const { data: task } = useTask(taskId ?? null);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId, taskId ?? "");
  const deleteTask = useDeleteTask(projectId);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [nested, setNested] = useState<{ taskId: string | null; parentTaskId?: string } | null>(null);

  if (!open) return null;

  const handleSubmit = async (data: TaskFormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      assignee_type: data.assignee_type,
      assignee_id: data.assignee_type === "team_member" ? data.assignee_id || null : null,
      client_assignee_id: data.assignee_type === "client" ? data.client_assignee_id || null : null,
      phase_id: data.phase_id || null,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      ...(taskId ? {} : { parent_task_id: defaultParentTaskId ?? null }),
    };
    if (taskId && task) {
      await updateTask.mutateAsync(payload);
    } else {
      await createTask.mutateAsync(payload);
    }
    onClose();
  };

  const isLoading = createTask.isPending || updateTask.isPending;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={taskId ? "Edit task" : defaultParentTaskId ? "New subtask" : "New task"}
        size="lg"
        footer={
          <>
            {taskId && (
              <Button
                type="button"
                variant="outline"
                className="me-auto text-(--destructive)"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={isLoading}>
              {taskId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <TaskForm task={task ?? undefined} projectId={projectId} clientId={clientId} formId={formId} onSubmit={handleSubmit} />
          {taskId && (
            <>
              <div className="border-t border-(--card-border) pt-4">
                <ChecklistPanel taskId={taskId} />
              </div>
              {!task?.parent_task_id && (
                <div className="border-t border-(--card-border) pt-4">
                  <SubtaskList
                    taskId={taskId}
                    onAddSubtask={() => setNested({ taskId: null, parentTaskId: taskId })}
                    onOpenSubtask={(st: Task) => setNested({ taskId: st.id })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {nested && (
        <TaskFormModal
          open
          onClose={() => setNested(null)}
          projectId={projectId}
          clientId={clientId}
          taskId={nested.taskId}
          defaultParentTaskId={nested.parentTaskId}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete task?"
        description="This will also delete its subtasks and checklist. This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteTask.isPending}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (!taskId) return;
          deleteTask.mutate(taskId, {
            onSuccess: () => {
              setDeleteConfirmOpen(false);
              onClose();
            },
          });
        }}
      />
    </>
  );
}
