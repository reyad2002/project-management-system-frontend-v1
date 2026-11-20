"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recurringTasksApi, taskTemplatesApi, type RecurringTaskInput, type TaskTemplateInput } from "@/lib/api";

// ---- Templates ----

export function useTaskTemplates(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["task-templates"],
    queryFn: () => taskTemplatesApi.list().then((r) => r.data),
    enabled: options?.enabled ?? true,
  });
}

export function useSaveTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Template saved" },
    mutationFn: ({ id, data }: { id?: string; data: TaskTemplateInput }) =>
      (id ? taskTemplatesApi.update(id, data) : taskTemplatesApi.create(data)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-templates"] }),
  });
}

export function useDeleteTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Template deleted" },
    mutationFn: (id: string) => taskTemplatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-templates"] }),
  });
}

export function useRestoreDefaultTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => taskTemplatesApi.restoreDefaults().then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-templates"] }),
  });
}

// ---- Recurring tasks ----

export function useRecurringTasks() {
  return useQuery({
    queryKey: ["recurring-tasks"],
    queryFn: () => recurringTasksApi.list().then((r) => r.data),
  });
}

export function useSaveRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Recurring task saved" },
    mutationFn: ({ id, data }: { id?: string; data: Partial<RecurringTaskInput> & Pick<RecurringTaskInput, "title" | "frequency"> }) =>
      (id ? recurringTasksApi.update(id, data) : recurringTasksApi.create(data)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-tasks"] });
      // A rule that is due today creates its task as soon as Tasks is opened.
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) => recurringTasksApi.update(id, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-tasks"] }),
  });
}

export function useDeleteRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Recurring task deleted" },
    mutationFn: (id: string) => recurringTasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-tasks"] }),
  });
}
