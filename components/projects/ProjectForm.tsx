"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { PROJECT_STATUSES, PROJECT_TYPES, BILLING_MODELS } from "@/lib/constants";
import type { Project } from "@/lib/api";

const schema = z
  .object({
    client_id: z.coerce.string().min(1, "Client is required"),
    title: z.string().min(1, "Title is required"),
    details: z.string().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    price: z.union([z.string(), z.number()]).optional(),
    type: z.enum(["software", "marketing", "branding", "social_media", "other"]),
    billing_model: z.enum(["fixed", "retainer", "hybrid"]),
    ad_budget: z.union([z.string(), z.number()]).optional(),
    budget_cost: z.union([z.string(), z.number()]).optional(),
    is_test: z.boolean(),
    status: z
      .enum(["draft", "active", "on_hold", "cancelled", "completed"])
      .optional(),
  })
  .refine(
    (d) => {
      if (!d.start_date || !d.due_date) return true;
      return new Date(d.due_date) >= new Date(d.start_date);
    },
    { message: "Due date must be after start date", path: ["due_date"] },
  );

export type ProjectFormData = z.infer<typeof schema>;

interface ProjectFormProps {
  project?: Project | null;
  clientOptions: { value: string; label: string }[];
  formId: string;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  /** New project for this client (opened from the client page). */
  defaultClientId?: string;
  /** "+ New client" under the client field; called when pressed. */
  onNewClient?: () => void;
  /** A client just created from this form: select it. */
  pickClientId?: string | null;
}

const defaultEmpty: ProjectFormData = {
  client_id: "",
  title: "",
  details: "",
  start_date: "",
  due_date: "",
  price: "",
  status: "active",
  type: "software",
  billing_model: "fixed",
  ad_budget: "",
  budget_cost: "",
  is_test: false,
};

export function ProjectForm({
  project,
  clientOptions,
  formId,
  onSubmit,
  defaultClientId,
  onNewClient,
  pickClientId,
}: ProjectFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  const billingModel = useWatch({ control, name: "billing_model" });
  const projectType = useWatch({ control, name: "type" });

  useEffect(() => {
    if (project) {
      reset({
        client_id: project.client_id != null ? String(project.client_id) : "",
        title: project.title ?? "",
        details: project.details ?? "",
        start_date: project.start_date ?? "",
        due_date: project.due_date ?? "",
        price: project.price ?? "",
        status: project.status ?? "active",
        type: project.type ?? "software",
        billing_model: project.billing_model ?? "fixed",
        ad_budget: project.ad_budget ? project.ad_budget : "",
        budget_cost: project.budget_cost ?? "",
        is_test: project.is_test ?? false,
      });
    } else {
      reset({ ...defaultEmpty, client_id: defaultClientId ?? "" });
    }
  }, [project, reset, defaultClientId]);

  useEffect(() => {
    if (pickClientId) setValue("client_id", pickClientId, { shouldValidate: true, shouldDirty: true });
  }, [pickClientId, setValue]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Controller
        name="client_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Client *"
            options={clientOptions}
            placeholder="Choose client"
            searchable
            error={errors.client_id?.message}
            {...field}
            value={field.value != null ? String(field.value) : ""}
            onChange={(v) => field.onChange(v != null ? String(v) : "")}
          />
        )}
      />
      {onNewClient && !project && (
        <button type="button" onClick={onNewClient} className="-mt-2 text-sm font-medium text-(--primary) hover:underline">
          + New client
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Project type *"
              options={PROJECT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              error={errors.type?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        <Controller
          name="billing_model"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Billing *"
              options={BILLING_MODELS.map((b) => ({ value: b.value, label: b.label }))}
              error={errors.billing_model?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      <Input
        label="Title *"
        error={errors.title?.message}
        {...register("title")}
      />
      <Textarea
        label="Details"
        error={errors.details?.message}
        {...register("details")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          error={errors.start_date?.message}
          {...register("start_date")}
        />
        <Input
          label="Due date"
          type="date"
          error={errors.due_date?.message}
          {...register("due_date")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={billingModel === "retainer" ? "Monthly fee" : billingModel === "hybrid" ? "Price / monthly fee" : "Price"}
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
              options={PROJECT_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
              placeholder="Select status"
              error={errors.status?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      {(projectType === "marketing" || projectType === "social_media") && (
        <Input
          label="Client ad budget (inside the price)"
          type="number"
          step="0.01"
          min="0"
          error={errors.ad_budget?.message}
          {...register("ad_budget")}
        />
      )}
      <Input
        label="Expected cost (budget, optional)"
        type="number"
        step="0.01"
        min="0"
        error={errors.budget_cost?.message}
        {...register("budget_cost")}
      />
      <label className="flex items-center gap-2 text-sm text-(--muted)">
        <input type="checkbox" {...register("is_test")} />
        Test / demo project (excluded from dashboard and reports)
      </label>
    </form>
  );
}
