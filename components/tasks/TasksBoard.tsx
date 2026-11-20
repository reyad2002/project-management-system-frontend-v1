"use client";

import { useState } from "react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Badge } from "@/components/ui/Badge";
import { useSetAnyTaskStatus } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@/lib/api";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "done", label: "Recently done" },
];

interface TasksBoardProps {
  /** Open tasks (to do / in progress / in review / blocked). */
  tasks: Task[];
  /** The most recently finished tasks, for the "Done" column. */
  doneTasks: Task[];
  onOpenTask: (id: string) => void;
}

/** Kanban over whatever the page's filters returned (any project, or internal). */
export function TasksBoard({ tasks, doneTasks, onOpenTask }: TasksBoardProps) {
  const setStatus = useSetAnyTaskStatus();
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const blocked = tasks.filter((t) => t.status === "blocked");

  return (
    <div className="space-y-4">
      {blocked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-(--destructive-bg) px-3 py-2">
          <Badge variant="danger">blocked</Badge>
          <span className="text-sm text-(--destructive)">
            {blocked.length} task{blocked.length > 1 ? "s" : ""} blocked — needs attention
          </span>
          <span className="flex flex-wrap gap-1.5">
            {blocked.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onOpenTask(String(t.id))}
                className="rounded-full border border-(--destructive)/30 px-2 py-0.5 text-xs text-(--destructive) hover:bg-(--card)"
              >
                {t.title}
              </button>
            ))}
          </span>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col, i) => {
          const items = col.status === "done" ? doneTasks : tasks.filter((t) => t.status === col.status);
          const next = COLUMNS[i + 1];
          return (
            <div
              key={col.status}
              className={`w-64 shrink-0 space-y-2 rounded-xl p-1 transition-colors ${overColumn === col.status ? "bg-(--accent-muted)" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverColumn(col.status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverColumn(null);
                const id = e.dataTransfer.getData("text/plain");
                const moved = [...tasks, ...doneTasks].find((t) => String(t.id) === id);
                if (moved && moved.status !== col.status) setStatus.mutate({ id, status: col.status });
              }}
            >
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-(--muted)">{col.label}</p>
                <span className="text-xs text-(--muted)">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(task.id));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setOverColumn(null)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard
                      task={task}
                      showProject
                      nextStatus={next ? { value: next.status, label: next.label } : undefined}
                      isMoving={setStatus.isPending}
                      onOpen={() => onOpenTask(String(task.id))}
                      onMoveNext={next ? () => setStatus.mutate({ id: String(task.id), status: next.status }) : undefined}
                    />
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-(--card-border) py-4 text-center text-xs text-(--muted)">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
