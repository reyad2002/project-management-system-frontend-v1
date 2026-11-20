"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { lastUsed, localToday } from "@/lib/last-used";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { EXPENSE_TYPES, COST_CATEGORIES } from "@/lib/constants";
import { useProjectsShortList } from "@/hooks/use-projects";
import { usePhases } from "@/hooks/use-phases";
import type { Expense } from "@/lib/api";

const schema = z.object({
  // amount: z.number().positive("Amount must be positive"),
  amount: z.number(),
  expense_date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["direct", "operational"]),
  project_id: z.string().optional(),
  phase_id: z.string().optional(),
  cost_category: z.enum([
    "labor",
    "materials",
    "subcontractor",
    "software",
    "travel",
    "marketing",
    "rent",
    "utilities",
    "other",
    "salary",
    "ad_spend",
    "equipment",
    "legal",
    "bank_fees",
    "advance",
  ]),
}).refine((d) => d.type !== "direct" || !!d.project_id, {
  message: "Pick the project this cost belongs to, or set the type to Operational",
  path: ["project_id"],
});

export type ExpenseFormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  formId: string;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  /** New expense on this project (opened from the project page). */
  defaultProjectId?: string;
}

const defaultEmpty: ExpenseFormData = {
  amount: 0,
  expense_date: new Date().toISOString().slice(0, 10),
  title: "",
  description: "",
  type: "direct",
  project_id: "",
  phase_id: "",
  cost_category: "other",
};

/** A new expense starts today, on the type and category used last time. */
function newExpense(projectId?: string): ExpenseFormData {
  return {
    ...defaultEmpty,
    expense_date: localToday(),
    type: lastUsed("expense_type", defaultEmpty.type, ["direct", "operational"]),
    cost_category: lastUsed("expense_category", defaultEmpty.cost_category) as ExpenseFormData["cost_category"],
    project_id: projectId ?? "",
  };
}

export function ExpenseForm({
  expense,
  formId,
  onSubmit,
  defaultProjectId,
}: ExpenseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  const { data: projectsData } = useProjectsShortList();
  const projectOptions = [
    { value: "", label: "General (no project)" },
    ...(projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? []),
  ];

  const selectedProjectId = watch("project_id");
  const selectedCategory = watch("cost_category");
  const { data: phasesData } = usePhases(selectedProjectId || null, { page: 1, limit: 100 });
  const phaseOptions = [
    { value: "", label: "No specific phase" },
    ...(phasesData?.phases?.map((ph) => ({ value: String(ph.id), label: ph.title })) ?? []),
  ];

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount,
        expense_date: expense.expense_date ?? defaultEmpty.expense_date,
        title: expense.title ?? "",
        description: expense.description ?? "",
        type: expense.type ?? "direct",
        project_id: expense.project_id ?? "",
        phase_id: expense.phase_id ?? "",
        cost_category: expense.cost_category ?? "other",
      });
    } else {
      reset(newExpense(defaultProjectId));
    }
  }, [expense, reset, defaultProjectId]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount *"
          type="number"
          // step="0.01"
          // min="0.01"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Input
          label="Expense date *"
          type="date"
          error={errors.expense_date?.message}
          {...register("expense_date")}
        />
      </div>
      <Input
        label="Title *"
        error={errors.title?.message}
        {...register("title")}
      />
      <Textarea
        label="Description"
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Type *"
              options={EXPENSE_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              placeholder="Select type"
              error={errors.type?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        <Controller
          name="cost_category"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Cost category *"
              options={COST_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              placeholder="Select category"
              error={errors.cost_category?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      {(selectedCategory === "advance" || selectedCategory === "equipment") && (
        <p className="rounded-lg bg-(--muted-bg) px-3 py-2 text-xs text-(--muted)">
          {selectedCategory === "advance"
            ? "Not counted in profit. The advance is recovered by deducting it from the salary, so record the salary at its full (gross) amount."
            : "Not counted in profit. Equipment is a purchase of an asset, not a running cost."}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="project_id"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Project"
              options={projectOptions}
              placeholder="General (no project)"
              searchable
              error={errors.project_id?.message}
              {...field}
              onChange={(v) => {
                field.onChange(v);
                setValue("phase_id", "");
              }}
            />
          )}
        />
        <Controller
          name="phase_id"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Phase"
              options={phaseOptions}
              placeholder="No specific phase"
              disabled={!selectedProjectId}
              error={errors.phase_id?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
    </form>
  );
}
