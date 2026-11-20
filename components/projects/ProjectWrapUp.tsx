"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAllTasks } from "@/hooks/use-tasks";
import { useUpdateProject } from "@/hooks/use-projects";

const OPEN = "todo,in_progress,in_review,blocked";

interface ProjectWrapUpProps {
  projectId: string;
  status: string;
  /** What the client still owes; null when the viewer can't see money (then only the tasks count). */
  remaining: number | null;
}

/**
 * Closes the loop "tasks done -> paid -> project completed": when every task is done and nothing is left
 * to collect, offer to mark the project completed (it otherwise tends to stay "active" for months).
 */
export function ProjectWrapUp({ projectId, status, remaining }: ProjectWrapUpProps) {
  const { data: open } = useAllTasks({ project_id: projectId, status: OPEN, limit: 1 });
  const { data: done } = useAllTasks({ project_id: projectId, status: "done", limit: 1 });
  const update = useUpdateProject(projectId);

  const allDone = open?.total === 0 && (done?.total ?? 0) > 0;
  const paid = remaining === null || remaining <= 0;
  if (status !== "active" || !allDone || !paid) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-(--success)/30 bg-(--success-bg) px-4 py-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-(--success)" />
      <p className="min-w-0 flex-1 text-sm text-(--foreground)">
        Every task is done{remaining !== null ? " and the project is fully paid" : ""}. Mark the project as completed?
      </p>
      <Button size="sm" loading={update.isPending} onClick={() => update.mutate({ status: "completed" })}>
        Mark completed
      </Button>
    </div>
  );
}
