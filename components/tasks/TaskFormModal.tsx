"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useUsersShortList } from "@/hooks/use-users";
import { useProjectsShortList } from "@/hooks/use-projects";
import { useCreateAnyTask, useUpdateAnyTask } from "@/hooks/use-tasks";
import type { Task } from "@/lib/api";

const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().optional(),
    project_id: z.string().optional(),
    status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    assignee_id: z.string().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
  })
  .refine((d) => !d.start_date || !d.due_date || d.due_date >= d.start_date, {
    message: "Due date must be on or after the start date",
    path: ["due_date"],
  });

type FormData = z.infer<typeof schema>;

const FORM_ID = "task-form";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Editing this task; omit to create. */
  task?: Task | null;
  /** Creating a sub-task of this task: the project is inherited and can't be changed. */
  parentTask?: Task | null;
  defaultProjectId?: string;
  /** Keep the project fixed to defaultProjectId (the project page's own task list). */
  lockProject?: boolean;
  /** Pre-fill the due date of a new task (the calendar's "add on this day"). */
  defaultDueDate?: string;
  onSaved?: (task: Task) => void;
}

export function TaskFormModal({ open, onClose, task, parentTask, defaultProjectId, lockProject, defaultDueDate, onSaved }: TaskFormModalProps) {
  const { user } = useAuth();
  const { data: usersData } = useUsersShortList();
  const { data: projectsData } = useProjectsShortList();
  const createTask = useCreateAnyTask();
  const updateTask = useUpdateAnyTask();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", project_id: "", status: "todo", priority: "medium", assignee_id: "", start_date: "", due_date: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        project_id: task.project_id ? String(task.project_id) : "",
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id ? String(task.assignee_id) : "",
        start_date: task.start_date ?? "",
        due_date: task.due_date ?? "",
      });
    } else {
      reset({
        title: "",
        description: "",
        project_id: parentTask?.project_id ? String(parentTask.project_id) : (defaultProjectId ?? ""),
        status: "todo",
        priority: "medium",
        // New tasks default to the person creating them; they can hand it over in one click.
        assignee_id: user?.id ? String(user.id) : "",
        start_date: "",
        due_date: defaultDueDate ?? "",
      });
    }
  }, [open, task, parentTask, defaultProjectId, defaultDueDate, user?.id, reset]);

  if (!open) return null;

  // A click outside or Escape must not throw away what was typed.
  const safeClose = () => {
    if (isDirty && !window.confirm("Discard the changes you made?")) return;
    onClose();
  };

  const editing = !!task;
  const projectLocked = editing || !!parentTask || !!lockProject;
  const projectOptions = [
    { value: "", label: "Internal (no project)" },
    ...(projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? []),
  ];
  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...(usersData?.users?.map((u) => ({ value: String(u.id), label: u.name })) ?? []),
  ];

  const onSubmit = async (d: FormData) => {
    const common = {
      title: d.title.trim(),
      description: d.description?.trim() || undefined,
      status: d.status,
      priority: d.priority,
      // A task already handed to a client keeps its client assignee (the backend rejects mixing the two).
      ...(task?.assignee_type === "client" ? {} : { assignee_id: d.assignee_id || null }),
      start_date: d.start_date || null,
      due_date: d.due_date || null,
    };
    const saved = task
      ? await updateTask.mutateAsync({ id: task.id, data: { ...common, description: d.description?.trim() ?? "" } })
      : await createTask.mutateAsync({
          ...common,
          project_id: d.project_id || null,
          parent_task_id: parentTask?.id ?? null,
        });
    onSaved?.(saved);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={safeClose}
      title={editing ? "Edit task" : parentTask ? `New sub-task of "${parentTask.title}"` : "New task"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={safeClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={createTask.isPending || updateTask.isPending}>
            {editing ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
        <Input label="Title *" error={errors.title?.message} autoFocus {...register("title")} />
        <Textarea label="Description" error={errors.description?.message} {...register("description")} />

        {projectLocked ? (
          <div>
            <p className="mb-1 text-sm font-medium text-(--foreground)">Project</p>
            <p className="text-sm text-(--muted)">{(task?.project_title ?? parentTask?.project_title ?? projectsData?.projects?.find((p) => String(p.id) === defaultProjectId)?.title) || "Internal (no project)"}</p>
          </div>
        ) : (
          <Controller
            name="project_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Project"
                options={projectOptions}
                searchable
                value={field.value}
                onChange={field.onChange}
                error={errors.project_id?.message}
              />
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Status"
                options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Priority"
                options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {task?.assignee_type === "client" ? (
          <div>
            <p className="mb-1 text-sm font-medium text-(--foreground)">Assignee</p>
            <p className="text-sm text-(--muted)">{task.client_assignee_name ?? "Client"} (client)</p>
          </div>
        ) : (
          <Controller
            name="assignee_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Assignee"
                options={assigneeOptions}
                searchable
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
          <Input label="Due date" type="date" error={errors.due_date?.message} {...register("due_date")} />
        </div>
      </form>
    </Modal>
  );
}
