"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useAddTaskDependency, useAllTasks, useRemoveTaskDependency, useTaskDependencies } from "@/hooks/use-tasks";
import { taskStatusVariant } from "@/lib/status-badges";
import type { Task } from "@/lib/api";

interface DependenciesPanelProps {
  task: Task;
}

/** "Waiting on": tasks that should finish first. A reminder, not a lock: nothing stops you moving the task. */
export function DependenciesPanel({ task }: DependenciesPanelProps) {
  const taskId = String(task.id);
  const { data } = useTaskDependencies(taskId);
  const add = useAddTaskDependency(taskId);
  const remove = useRemoveTaskDependency(taskId);
  const [picked, setPicked] = useState("");

  // Candidates: unfinished tasks of the same project (or the internal ones), as the API requires.
  const { data: candidates } = useAllTasks({
    project_id: task.project_id ?? undefined,
    internal: task.project_id ? undefined : true,
    status: "todo,in_progress,in_review,blocked",
    limit: 200,
  });

  const deps = data?.dependsOn ?? [];
  const waitingOn = deps.filter((d) => d.status !== "done");
  const taken = new Set([taskId, ...deps.map((d) => String(d.id))]);
  const options = (candidates?.tasks ?? []).filter((t) => !taken.has(String(t.id))).map((t) => ({ value: String(t.id), label: t.title }));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-(--muted)">Waiting on {deps.length > 0 && `(${deps.length})`}</p>
        {waitingOn.length > 0 && task.status !== "done" && (
          <Badge variant="warning" dot={false}>
            {waitingOn.length} not finished
          </Badge>
        )}
      </div>
      {deps.length > 0 && (
        <ul className="space-y-1.5">
          {deps.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-2.5 py-1.5">
              <span className={`min-w-0 truncate text-sm ${d.status === "done" ? "text-(--muted) line-through" : "text-(--foreground)"}`}>{d.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant={taskStatusVariant[d.status]} dot={false}>
                  {d.status.replace("_", " ")}
                </Badge>
                <button type="button" aria-label="Remove dependency" onClick={() => remove.mutate(String(d.id))} className="text-(--muted) hover:text-(--destructive)">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {options.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <CustomSelect options={[{ value: "", label: "Add a task it waits on..." }, ...options]} value={picked} searchable onChange={setPicked} />
          </div>
          <button
            type="button"
            aria-label="Add dependency"
            disabled={!picked || add.isPending}
            onClick={() => add.mutate(picked, { onSuccess: () => setPicked("") })}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-(--border) text-(--muted) hover:text-(--foreground) disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
