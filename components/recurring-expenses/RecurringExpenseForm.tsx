"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useProjectsShortList } from "@/hooks/use-projects";
import type { RecurringExpense } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Service name is required"),
  linked_project_id: z.string().optional(),
  type: z.enum(["hosting_cost", "ai_subscription", "tool_subscription", "other"]),
  amount: z.number().positive("Amount must be positive"),
  billing_cycle: z.enum(["monthly", "yearly"]),
  next_due_date: z.string().min(1, "Due date is required"),
  auto_charge: z.boolean(),
  notes: z.string().optional(),
});

export type RecurringExpenseFormData = z.infer<typeof schema>;

interface RecurringExpenseFormProps {
  record?: RecurringExpense | null;
  formId: string;
  onSubmit: (data: RecurringExpenseFormData) => Promise<void>;
}

const defaultValues: RecurringExpenseFormData = {
  name: "",
  linked_project_id: "",
  type: "hosting_cost",
  amount: 0,
  billing_cycle: "monthly",
  next_due_date: "",
  auto_charge: true,
  notes: "",
};

export function RecurringExpenseForm({ record, formId, onSubmit }: RecurringExpenseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const autoCharge = useWatch({ control, name: "auto_charge" });
  const dueDate = useWatch({ control, name: "next_due_date" });
  const cycle = useWatch({ control, name: "billing_cycle" });
  const startsInThePast = !!dueDate && dueDate < new Date().toISOString().slice(0, 10);

  const { data: projectsData } = useProjectsShortList();
  const projectOptions = [
    { value: "", label: "Not project-specific" },
    ...(projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? []),
  ];

  useEffect(() => {
    if (record) {
      reset({
        name: record.name,
        linked_project_id: record.linked_project_id != null ? String(record.linked_project_id) : "",
        type: record.type,
        amount: record.amount,
        billing_cycle: record.billing_cycle,
        next_due_date: record.next_due_date,
        auto_charge: record.auto_charge ?? true,
        notes: record.notes ?? "",
      });
    } else {
      reset(defaultValues);
    }
  }, [record, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Input label="Service name *" placeholder="AWS, OpenAI, Vercel Pro..." error={errors.name?.message} {...register("name")} />
      <Controller
        name="linked_project_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Project"
            options={projectOptions}
            placeholder="Not project-specific"
            searchable
            error={errors.linked_project_id?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Type *"
              options={[
                { value: "hosting_cost", label: "Hosting cost" },
                { value: "ai_subscription", label: "AI subscription" },
                { value: "tool_subscription", label: "Tool subscription" },
                { value: "other", label: "Other" },
              ]}
              error={errors.type?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
        <Controller
          name="billing_cycle"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Billing cycle *"
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
              error={errors.billing_cycle?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount *"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Input
          label="Next due date *"
          type="date"
          error={errors.next_due_date?.message}
          {...register("next_due_date")}
        />
      </div>
      <div className="rounded-lg border border-(--border) p-3">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" {...register("auto_charge")} />
          <span>
            <span className="font-medium text-foreground">Deduct automatically</span>
            <span className="block text-xs text-(--muted)">
              On each due date the expense is recorded for you and the date moves forward one {cycle === "yearly" ? "year" : "month"}.
              Turn it off to confirm each payment yourself.
            </span>
          </span>
        </label>
        {autoCharge && startsInThePast && (
          <p className="mt-2 text-xs text-(--caution)">
            This date has already passed: every missed {cycle === "yearly" ? "year" : "month"} up to today will be recorded as an expense when you save.
          </p>
        )}
      </div>
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
