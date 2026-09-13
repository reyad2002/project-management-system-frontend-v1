"use client";

import { useTasks, useSetTaskStatus } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Badge } from "@/components/ui/Badge";
import type { TaskStatus, Task } from "@/lib/api";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "done", label: "Done" },
];

interface KanbanBoardProps {
  projectId: string;
  onOpenTask: (task: Task) => void;
}

export function KanbanBoard({ projectId, onOpenTask }: KanbanBoardProps) {
  const { data, isLoading } = useTasks(projectId);
  const setStatus = useSetTaskStatus(projectId);

  const allTasks = (data?.tasks ?? []).filter((t) => !t.parent_task_id);
  const blockedTasks = allTasks.filter((t) => t.status === "blocked");

  if (isLoading) {
    return <p className="py-8 text-center text-(--muted)">Loading tasks…</p>;
  }

  if (allTasks.length === 0) {
    return <p className="py-8 text-center text-(--muted)">No tasks yet.</p>;
  }

  return (
    <div className="space-y-4">
      {blockedTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-(--destructive-bg) px-3 py-2">
          <Badge variant="danger">blocked</Badge>
          <span className="text-sm text-(--destructive)">
            {blockedTasks.length} task{blockedTasks.length > 1 ? "s" : ""} blocked — needs attention
          </span>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col, colIndex) => {
          const columnTasks = allTasks.filter((t) => t.status === col.status);
          const next = COLUMNS[colIndex + 1];
          return (
            <div key={col.status} className="w-64 shrink-0 space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-(--muted)">{col.label}</p>
                <span className="text-xs text-(--muted)">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    nextStatus={next ? { value: next.status, label: next.label } : undefined}
                    onOpen={() => onOpenTask(task)}
                    isMoving={setStatus.isPending}
                    onMoveNext={
                      next ? () => setStatus.mutate({ id: task.id, status: next.status }) : undefined
                    }
                  />
                ))}
                {columnTasks.length === 0 && (
                  <p className="rounded-lg border border-dashed border-(--card-border) py-4 text-center text-xs text-(--muted)">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
