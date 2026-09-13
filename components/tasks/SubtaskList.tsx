"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useSubtasks } from "@/hooks/use-tasks";
import { taskStatusVariant } from "@/lib/status-badges";
import type { Task } from "@/lib/api";

interface SubtaskListProps {
  taskId: string;
  onAddSubtask: () => void;
  onOpenSubtask: (task: Task) => void;
}

export function SubtaskList({ taskId, onAddSubtask, onOpenSubtask }: SubtaskListProps) {
  const { data } = useSubtasks(taskId);
  const subtasks = data?.tasks ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-(--muted)">Subtasks {subtasks.length > 0 && `(${subtasks.length})`}</p>
        <button
          type="button"
          onClick={onAddSubtask}
          className="flex items-center gap-1 text-xs font-medium text-(--primary) hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add subtask
        </button>
      </div>
      {subtasks.length > 0 && (
        <ul className="space-y-1.5">
          {subtasks.map((st) => (
            <li key={st.id}>
              <button
                type="button"
                onClick={() => onOpenSubtask(st)}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-2.5 py-1.5 text-left transition-colors hover:bg-(--muted-bg)/70"
              >
                <span className="truncate text-sm text-(--foreground)">{st.title}</span>
                <Badge variant={taskStatusVariant[st.status]} dot={false} className="shrink-0">
                  {st.status.replace("_", " ")}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
