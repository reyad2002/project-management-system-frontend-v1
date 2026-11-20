"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { publishAppError, toastInfo, toastSuccess } from "@/lib/error-bus";
import {
  tasksApi,
  type CreateTaskInput,
  type TaskStatus,
  type TaskPriority,
  type TaskListParams,
  type TaskBulkPatch,
  type Task,
} from "@/lib/api";

type TaskList = { tasks: Task[]; total: number; page: number; limit: number };

/** Change tasks in every cached list and detail right away (the request follows); returns an undo. */
function patchCachedTasks(qc: QueryClient, ids: string[], change: (t: Task) => Task | null) {
  const wanted = new Set(ids.map(String));
  const lists = qc.getQueriesData<TaskList>({ queryKey: ["tasks", "all"] });
  const details = ids.map((id) => [["tasks", "detail", id], qc.getQueryData<Task>(["tasks", "detail", id])] as const);
  for (const [key, data] of lists) {
    if (!data?.tasks) continue;
    const next = data.tasks.flatMap((t) => (wanted.has(String(t.id)) ? (change(t) ? [change(t) as Task] : []) : [t]));
    qc.setQueryData<TaskList>(key, { ...data, tasks: next, total: Math.max(0, data.total - (data.tasks.length - next.length)) });
  }
  for (const [key, data] of details) {
    if (data) {
      const changed = change(data);
      if (changed) qc.setQueryData(key, changed);
    }
  }
  return () => {
    for (const [key, data] of lists) qc.setQueryData(key, data);
    for (const [key, data] of details) qc.setQueryData(key, data);
  };
}

// ---- Task management (across projects + internal) ----

export function useAllTasks(params: TaskListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tasks", "all", params],
    queryFn: () => tasksApi.listAll(params).then((r) => r.data),
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });
}

export function useTaskSummary(scope?: "mine" | "all") {
  return useQuery({
    queryKey: ["tasks", "summary", scope],
    queryFn: () => tasksApi.summary(scope).then((r) => r.data),
  });
}

/** Any task change can affect lists, boards, the summary tiles and project views: refresh them all. */
function refreshAllTasks(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["tasks"] });
  qc.invalidateQueries({ queryKey: ["timeline"] });
  qc.invalidateQueries({ queryKey: ["team", "workload"] });
  qc.invalidateQueries({ queryKey: ["notifications"] });
}

export function useCreateAnyTask() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Task created" },
    mutationFn: (data: CreateTaskInput & { project_id?: string | null }) =>
      tasksApi.createGeneral(data).then((r) => r.data),
    onSuccess: () => refreshAllTasks(qc),
  });
}

export function useUpdateAnyTask() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Task saved" },
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskInput> }) =>
      tasksApi.update(id, data).then((r) => r.data),
    // Edits show at once (inline edits in the list); a failure puts the old values back.
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      return { undo: patchCachedTasks(qc, [id], (t) => ({ ...t, ...(data as Partial<Task>) })) };
    },
    onError: (_err, _vars, ctx) => ctx?.undo(),
    onSettled: () => refreshAllTasks(qc),
  });
}

/** Status changes show at once (ticking a task off should feel instant); a failure puts it back. */
export function useSetAnyTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => tasksApi.setStatus(id, status).then((r) => r.data),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      return { undo: patchCachedTasks(qc, [id], (t) => ({ ...t, status })) };
    },
    onError: (_err, _vars, ctx) => ctx?.undo(),
    onSettled: () => refreshAllTasks(qc),
  });
}

/**
 * Delete with a 5-second "Undo" instead of an "Are you sure?" dialog: the task disappears at once and is
 * really deleted only when the toast runs out. (Closing the tab within those seconds keeps the task.)
 */
export function useDeleteTasksWithUndo() {
  const qc = useQueryClient();
  return useCallback(
    (tasks: { id: string; title: string }[]) => {
      if (tasks.length === 0) return;
      const ids = tasks.map((t) => String(t.id));
      const undo = patchCachedTasks(qc, ids, () => null);
      let cancelled = false;
      const timer = window.setTimeout(async () => {
        if (cancelled) return;
        try {
          if (ids.length === 1) await tasksApi.delete(ids[0]);
          else await tasksApi.bulkDelete(ids);
        } catch (err) {
          undo();
          publishAppError(err);
        } finally {
          refreshAllTasks(qc);
        }
      }, 5000);
      toastInfo(tasks.length === 1 ? `Deleted "${tasks[0].title}"` : `Deleted ${tasks.length} tasks`, {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            cancelled = true;
            window.clearTimeout(timer);
            undo();
          },
        },
      });
    },
    [qc],
  );
}

/** Change many tasks at once (status, priority, assignee or due date). */
export function useBulkUpdateTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: TaskBulkPatch }) => tasksApi.bulkUpdate(ids, patch).then((r) => r.data),
    onMutate: async ({ ids, patch }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const visible: Partial<Task> = { ...patch } as Partial<Task>;
      return { undo: patchCachedTasks(qc, ids, (t) => ({ ...t, ...visible })) };
    },
    onError: (_err, _vars, ctx) => ctx?.undo(),
    onSuccess: (r) => toastSuccess(r.skipped ? `Updated ${r.updated} tasks (${r.skipped} skipped)` : `Updated ${r.updated} task${r.updated === 1 ? "" : "s"}`),
    onSettled: () => refreshAllTasks(qc),
  });
}

export function useDeleteAnyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => refreshAllTasks(qc),
  });
}

export function useTasks(
  projectId: string | null,
  params?: { status?: TaskStatus; assignee_id?: string; priority?: TaskPriority }
) {
  return useQuery({
    queryKey: ["tasks", projectId, params],
    queryFn: () => tasksApi.list(projectId!, params).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useSubtasks(taskId: string | null) {
  return useQuery({
    queryKey: ["tasks", taskId, "subtasks"],
    queryFn: () => tasksApi.subtasks(taskId!).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["tasks", "detail", id],
    queryFn: () => tasksApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

function invalidateTaskQueries(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: ["tasks", projectId] });
  qc.invalidateQueries({ queryKey: ["timeline", projectId] });
  qc.invalidateQueries({ queryKey: ["team", "workload"] });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Task created" },
    mutationFn: (data: CreateTaskInput) => tasksApi.create(projectId, data).then((r) => r.data),
    onSuccess: (task) => {
      invalidateTaskQueries(qc, projectId);
      if (task.parent_task_id) qc.invalidateQueries({ queryKey: ["tasks", task.parent_task_id, "subtasks"] });
    },
  });
}

export function useUpdateTask(projectId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Task saved" },
    mutationFn: (data: Partial<CreateTaskInput>) => tasksApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      invalidateTaskQueries(qc, projectId);
      qc.invalidateQueries({ queryKey: ["tasks", "detail", id] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => invalidateTaskQueries(qc, projectId),
  });
}

export function useSetTaskStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.setStatus(id, status).then((r) => r.data),
    onSuccess: () => invalidateTaskQueries(qc, projectId),
  });
}

export function useReorderTasks(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskIds: string[]) => tasksApi.reorder(projectId, taskIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
  });
}

export function useTaskChecklist(taskId: string | null) {
  return useQuery({
    queryKey: ["tasks", taskId, "checklist"],
    queryFn: () => tasksApi.checklist.list(taskId!).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useAddChecklistItem(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => tasksApi.checklist.add(taskId, title).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "checklist"] }),
  });
}

export function useUpdateChecklistItem(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; is_done?: boolean; position?: number }) =>
      tasksApi.checklist.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "checklist"] }),
  });
}

export function useDeleteChecklistItem(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.checklist.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "checklist"] }),
  });
}

export function useTaskDependencies(taskId: string | null) {
  return useQuery({
    queryKey: ["tasks", taskId, "dependencies"],
    queryFn: () => tasksApi.dependencies.list(taskId!).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useAddTaskDependency(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnTaskId: string) => tasksApi.dependencies.add(taskId, dependsOnTaskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "dependencies"] }),
  });
}

export function useRemoveTaskDependency(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnId: string) => tasksApi.dependencies.remove(taskId, dependsOnId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "dependencies"] }),
  });
}

// ---- Comments, links, report, preferences ----

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: ["tasks", taskId, "comments"],
    queryFn: () => tasksApi.comments.list(taskId!).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useAddTaskComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => tasksApi.comments.add(taskId, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] }),
  });
}

export function useUpdateTaskComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => tasksApi.comments.update(id, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] }),
  });
}

export function useDeleteTaskComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.comments.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] }),
  });
}

export function useTaskAttachments(taskId: string | null) {
  return useQuery({
    queryKey: ["tasks", taskId, "attachments"],
    queryFn: () => tasksApi.attachments.list(taskId!).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useAddTaskAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ url, name }: { url: string; name?: string }) => tasksApi.attachments.add(taskId, url, name).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "attachments"] }),
  });
}

export function useDeleteTaskAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.attachments.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", taskId, "attachments"] }),
  });
}

export function useTaskReport(params: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["tasks", "report", params],
    queryFn: () => tasksApi.report(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useTaskPreferences() {
  return useQuery({
    queryKey: ["tasks", "preferences"],
    queryFn: () => tasksApi.preferences().then((r) => r.data),
  });
}

export function useSetTaskPreferences() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Preference saved" },
    mutationFn: (digest: boolean) => tasksApi.setPreferences(digest).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", "preferences"] }),
  });
}
