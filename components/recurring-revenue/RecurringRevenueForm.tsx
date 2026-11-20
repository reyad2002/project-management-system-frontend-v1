"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useClientsShortList } from "@/hooks/use-clients";
import { useProjectsShortList } from "@/hooks/use-projects";
import type { RecurringRevenue } from "@/lib/api";

const schema = z.object({
  client_id: z.string().min(1, "Client is required"),
  project_id: z.string().optional(),
  type: z.enum(["hosting", "maintenance", "other"]),
  amount: z.number().positive("Amount must be positive"),
  billing_cycle: z.enum(["monthly", "yearly"]),
  next_renewal_date: z.string().min(1, "Renewal date is required"),
  notes: z.string().optional(),
});

export type RecurringRevenueFormData = z.infer<typeof schema>;

interface RecurringRevenueFormProps {
  record?: RecurringRevenue | null;
  formId: string;
  onSubmit: (data: RecurringRevenueFormData) => Promise<void>;
}

const defaultValues: RecurringRevenueFormData = {
  client_id: "",
  project_id: "",
  type: "hosting",
  amount: 0,
  billing_cycle: "yearly",
  next_renewal_date: "",
  notes: "",
};

export function RecurringRevenueForm({ record, formId, onSubmit }: RecurringRevenueFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecurringRevenueFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { data: clientsData } = useClientsShortList();
  const clientOptions = clientsData?.clients?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

  const { data: projectsData } = useProjectsShortList();
  const projectOptions = [
    { value: "", label: "No specific project" },
    ...(projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? []),
  ];

  useEffect(() => {
    if (record) {
      reset({
        client_id: String(record.client_id),
        project_id: record.project_id != null ? String(record.project_id) : "",
        type: record.type,
        amount: record.amount,
        billing_cycle: record.billing_cycle,
        next_renewal_date: record.next_renewal_date,
        notes: record.notes ?? "",
      });
    } else {
      reset(defaultValues);
    }
  }, [record, reset]);

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
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <Controller
        name="project_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Project"
            options={projectOptions}
            placeholder="No specific project"
            searchable
            error={errors.project_id?.message}
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
                { value: "hosting", label: "Hosting" },
                { value: "maintenance", label: "Maintenance" },
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
          label="Next renewal date *"
          type="date"
          error={errors.next_renewal_date?.message}
          {...register("next_renewal_date")}
        />
      </div>
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
