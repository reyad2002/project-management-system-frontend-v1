"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { useUsersShortList } from "@/hooks/use-users";
import { usePhases } from "@/hooks/use-phases";
import { useClientPortalUsers } from "@/hooks/use-client-portal";
import type { Task } from "@/lib/api";

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    assignee_type: z.enum(["team_member", "client"]),
    assignee_id: z.string().optional(),
    client_assignee_id: z.string().optional(),
    phase_id: z.string().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
  })
  .refine((d) => !d.start_date || !d.due_date || new Date(d.due_date) >= new Date(d.start_date), {
    message: "Due date must be on or after start date",
    path: ["due_date"],
  });

export type TaskFormData = z.infer<typeof schema>;

interface TaskFormProps {
  task?: Task | null;
  projectId: string;
  clientId: string;
  formId: string;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

const defaultEmpty: TaskFormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignee_type: "team_member",
  assignee_id: "",
  client_assignee_id: "",
  phase_id: "",
  start_date: "",
  due_date: "",
};

export function TaskForm({ task, projectId, clientId, formId, onSubmit }: TaskFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  const assigneeType = watch("assignee_type");

  const { data: usersData } = useUsersShortList();
  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...(usersData?.users?.map((u) => ({ value: String(u.id), label: u.name })) ?? []),
  ];

  const { data: portalUsersData } = useClientPortalUsers(clientId);
  const clientAssigneeOptions = [
    { value: "", label: "Unassigned" },
    ...(portalUsersData?.portalUsers?.map((u) => ({ value: String(u.id), label: u.name })) ?? []),
  ];

  const { data: phasesData } = usePhases(projectId, { page: 1, limit: 100 });
  const phaseOptions = [
    { value: "", label: "No specific phase" },
    ...(phasesData?.phases?.map((ph) => ({ value: String(ph.id), label: ph.title })) ?? []),
  ];

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        assignee_type: task.assignee_type,
        assignee_id: task.assignee_id != null ? String(task.assignee_id) : "",
        client_assignee_id: task.client_assignee_id != null ? String(task.client_assignee_id) : "",
        phase_id: task.phase_id != null ? String(task.phase_id) : "",
        start_date: task.start_date ?? "",
        due_date: task.due_date ?? "",
      });
    } else {
      reset(defaultEmpty);
    }
  }, [task, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Input label="Title *" error={errors.title?.message} {...register("title")} />
      <Textarea label="Description" error={errors.description?.message} {...register("description")} />
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Status *"
              options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              placeholder="Select status"
              error={errors.status?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Priority *"
              options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Select priority"
              error={errors.priority?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="assignee_type"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Assign to"
              options={[
                { value: "team_member", label: "Team member" },
                { value: "client", label: "Client" },
              ]}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        {assigneeType === "client" ? (
          <Controller
            name="client_assignee_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Assignee"
                options={clientAssigneeOptions}
                placeholder="Unassigned"
                searchable
                error={errors.client_assignee_id?.message}
                {...field}
                onChange={(v) => field.onChange(v)}
              />
            )}
          />
        ) : (
          <Controller
            name="assignee_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Assignee"
                options={assigneeOptions}
                placeholder="Unassigned"
                searchable
                error={errors.assignee_id?.message}
                {...field}
                onChange={(v) => field.onChange(v)}
              />
            )}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="phase_id"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Phase"
              options={phaseOptions}
              placeholder="No specific phase"
              error={errors.phase_id?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
        <Input label="Due date" type="date" error={errors.due_date?.message} {...register("due_date")} />
      </div>
    </form>
  );
}
