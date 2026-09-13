"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi,
  type CreateTaskInput,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/api";

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
