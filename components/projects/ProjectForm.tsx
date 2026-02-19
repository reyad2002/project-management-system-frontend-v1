"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { PROJECT_STATUSES } from "@/lib/constants";
import type { Project } from "@/lib/api";

const schema = z.object({
  client_id: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  details: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["draft", "active", "on_hold", "cancelled", "completed"]).optional(),
}).refine(
  (d) => {
    if (!d.start_date || !d.due_date) return true;
    return new Date(d.due_date) >= new Date(d.start_date);
  },
  { message: "Due date must be after start date", path: ["due_date"] }
);

export type ProjectFormData = z.infer<typeof schema>;

interface ProjectFormProps {
  project?: Project | null;
  clientOptions: { value: string; label: string }[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const defaultEmpty: ProjectFormData = {
  client_id: "",
  title: "",
  details: "",
  start_date: "",
  due_date: "",
  price: "",
  status: "active",
};

export function ProjectForm({
  project,
  clientOptions,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  useEffect(() => {
    if (project) {
      reset({
        client_id: project.client_id ?? "",
        title: project.title ?? "",
        details: project.details ?? "",
        start_date: project.start_date ?? "",
        due_date: project.due_date ?? "",
        price: project.price ?? "",
        status: project.status ?? "active",
      });
    } else {
      reset(defaultEmpty);
    }
  }, [project, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        name="client_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Client *"
            options={clientOptions}
            placeholder="Choose client"
            error={errors.client_id?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <Input label="Title *" error={errors.title?.message} {...register("title")} />
      <Textarea label="Details" error={errors.details?.message} {...register("details")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
        <Input label="Due date" type="date" error={errors.due_date?.message} {...register("due_date")} />
      </div>
      <div className="grid grid-cols-2 gap-4">

      <Input
        label="Price"
        type="number"
        step="0.01"
        min="0"
        error={errors.price?.message}
        {...register("price")}
      />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Status"
            options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            placeholder="Select status"
            error={errors.status?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" loading={isLoading}>
          {project ? "Update" : "Create"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
