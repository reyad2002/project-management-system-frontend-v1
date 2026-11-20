"use client";

import { ArrowRight, Layers, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { taskPriorityVariant } from "@/lib/status-badges";
import type { Task, TaskStatus } from "@/lib/api";

interface TaskCardProps {
  task: Task;
  nextStatus?: { value: TaskStatus; label: string };
  onOpen: () => void;
  onMoveNext?: () => void;
  isMoving?: boolean;
  /** Show which project the task belongs to (the cross-project board does). */
  showProject?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TaskCard({ task, nextStatus, onOpen, onMoveNext, isMoving, showProject }: TaskCardProps) {
  const isOverdue = !!task.due_date && task.status !== "done" && new Date(task.due_date) < new Date(new Date().toDateString());

  const assigneeName = task.assignee_type === "client" ? task.client_assignee_name : task.assignee_name;

  return (
    <div className="rounded-xl border border-(--card-border) bg-(--card) p-3 shadow-sm">
      <button type="button" onClick={onOpen} className="block w-full text-start">
        <p className="text-sm font-medium text-(--foreground)">{task.title}</p>
        {showProject && (
          <p className="mt-0.5 truncate text-xs text-(--muted)">{task.project_title ?? "Internal"}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={taskPriorityVariant[task.priority]} dot={false}>
            {task.priority}
          </Badge>
          {task.source === "meeting" && (
            <Badge variant="info" dot={false} className="text-[10px]">
              From meeting
            </Badge>
          )}
          {assigneeName && (
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-semibold ${
                task.assignee_type === "client"
                  ? "bg-(--warning-bg) text-(--warning)"
                  : "bg-(--accent-muted) text-(--primary)"
              }`}
              title={`${assigneeName}${task.assignee_type === "client" ? " (client)" : ""}`}
            >
              {initials(assigneeName)}
            </span>
          )}
          {task.due_date && (
            <span className={`text-xs ${isOverdue ? "font-medium text-(--destructive)" : "text-(--muted)"}`}>
              {task.due_date}
            </span>
          )}
        </div>
        {(task.subtasks_count > 0 || task.checklist_progress.total > 0) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-(--muted)">
            {task.subtasks_count > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {task.subtasks_count}
              </span>
            )}
            {task.checklist_progress.total > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5" />
                {task.checklist_progress.done}/{task.checklist_progress.total}
              </span>
            )}
          </div>
        )}
      </button>
      {nextStatus && onMoveNext && (
        <button
          type="button"
          onClick={onMoveNext}
          disabled={isMoving}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-(--border) py-1.5 text-xs font-medium text-(--muted) transition-colors hover:border-(--primary) hover:text-(--primary) disabled:opacity-50"
        >
          Move to {nextStatus.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
