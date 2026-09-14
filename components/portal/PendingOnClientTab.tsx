"use client";

import { Badge } from "@/components/ui/Badge";
import { usePendingOnClientTasks } from "@/hooks/use-portal";

interface PendingOnClientTabProps {
  projectId: string;
}

export function PendingOnClientTab({ projectId }: PendingOnClientTabProps) {
  const { data, isLoading } = usePendingOnClientTasks(projectId);
  const tasks = data?.tasks ?? [];

  if (isLoading) return <p className="text-(--muted)">Loading...</p>;
  if (tasks.length === 0) return <p className="text-(--muted)">Nothing pending on you right now.</p>;

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const isOverdue = !!task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());
        return (
          <li
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-(--foreground)">{task.title}</p>
              {task.description && <p className="text-xs text-(--muted)">{task.description}</p>}
            </div>
            {task.due_date && (
              <Badge variant={isOverdue ? "danger" : "neutral"}>Due {task.due_date}</Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
}
