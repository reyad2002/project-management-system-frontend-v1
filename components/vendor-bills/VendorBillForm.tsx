"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { COST_CATEGORIES } from "@/lib/constants";
import { useProjectsShortList } from "@/hooks/use-projects";
import type { VendorBill } from "@/lib/api";

const schema = z
  .object({
    project_id: z.string().optional(),
    bill_number: z.string().optional(),
    bill_date: z.string().min(1, "Bill date is required"),
    due_date: z.string().min(1, "Due date is required"),
    subtotal: z.number().positive("Amount must be positive"),
    vat_rate: z.number().min(0).max(100),
    wht_rate: z.number().min(0).max(100),
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
    ]),
    notes: z.string().optional(),
  })
  .refine((d) => !d.bill_date || !d.due_date || new Date(d.due_date) >= new Date(d.bill_date), {
    message: "Due date must be on or after bill date",
    path: ["due_date"],
  });

export type VendorBillFormData = z.infer<typeof schema>;

interface VendorBillFormProps {
  bill?: VendorBill | null;
  defaultWhtRate?: number;
  formId: string;
  onSubmit: (data: VendorBillFormData) => Promise<void>;
}

const getDefaultValues = (defaultWhtRate = 0): VendorBillFormData => ({
  project_id: "",
  bill_number: "",
  bill_date: new Date().toISOString().slice(0, 10),
  due_date: new Date().toISOString().slice(0, 10),
  subtotal: 0,
  vat_rate: 14,
  wht_rate: defaultWhtRate,
  cost_category: "other",
  notes: "",
});

export function VendorBillForm({ bill, defaultWhtRate, formId, onSubmit }: VendorBillFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorBillFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(defaultWhtRate),
  });

  const { data: projectsData } = useProjectsShortList();
  const projectOptions = [
    { value: "", label: "No project (general purchase)" },
    ...(projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? []),
  ];

  useEffect(() => {
    if (bill) {
      reset({
        project_id: bill.project_id ?? "",
        bill_number: bill.bill_number ?? "",
        bill_date: bill.bill_date,
        due_date: bill.due_date,
        subtotal: bill.subtotal,
        vat_rate: bill.vat_rate,
        wht_rate: bill.wht_rate,
        cost_category: bill.cost_category ?? "other",
        notes: bill.notes ?? "",
      });
    } else {
      reset(getDefaultValues(defaultWhtRate));
    }
  }, [bill, defaultWhtRate, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Bill number" error={errors.bill_number?.message} {...register("bill_number")} />
        <Controller
          name="project_id"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Project"
              options={projectOptions}
              placeholder="No project"
              searchable
              error={errors.project_id?.message}
              {...field}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Bill date *" type="date" error={errors.bill_date?.message} {...register("bill_date")} />
        <Input label="Due date *" type="date" error={errors.due_date?.message} {...register("due_date")} />
      </div>
      <Input
        label="Subtotal (before VAT) *"
        type="number"
        step="0.01"
        min="0.01"
        error={errors.subtotal?.message}
        {...register("subtotal", { valueAsNumber: true })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="VAT rate (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          error={errors.vat_rate?.message}
          {...register("vat_rate", { valueAsNumber: true })}
        />
        <Input
          label="WHT rate (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          error={errors.wht_rate?.message}
          {...register("wht_rate", { valueAsNumber: true })}
        />
      </div>
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
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
