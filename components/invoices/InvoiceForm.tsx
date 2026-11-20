"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { useProjects } from "@/hooks/use-projects";
import { usePhases } from "@/hooks/use-phases";
import type { Invoice } from "@/lib/api";

const schema = z
  .object({
    project_id: z.string().min(1, "Project is required"),
    phase_id: z.string().optional(),
    issue_date: z.string().min(1, "Issue date is required"),
    due_date: z.string().min(1, "Due date is required"),
    subtotal: z.number().positive("Amount must be positive"),
    vat_rate: z.number().min(0).max(100),
    wht_rate: z.number().min(0).max(100),
    notes: z.string().optional(),
  })
  .refine((d) => !d.issue_date || !d.due_date || new Date(d.due_date) >= new Date(d.issue_date), {
    message: "Due date must be on or after issue date",
    path: ["due_date"],
  });

export type InvoiceFormData = z.infer<typeof schema>;

interface InvoiceFormProps {
  /** When set the form edits this invoice instead of creating one. */
  invoice?: Invoice | null;
  defaultProjectId?: string;
  formId: string;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
}

const getDefaultValues = (defaultProjectId?: string): InvoiceFormData => ({
  project_id: defaultProjectId ?? "",
  phase_id: "",
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: new Date().toISOString().slice(0, 10),
  subtotal: 0,
  vat_rate: 14,
  wht_rate: 0,
  notes: "",
});

export function InvoiceForm({ invoice, defaultProjectId, formId, onSubmit }: InvoiceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(defaultProjectId),
  });

  useEffect(() => {
    if (invoice) {
      reset({
        project_id: String(invoice.project_id),
        phase_id: invoice.phase_id != null ? String(invoice.phase_id) : "",
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal,
        vat_rate: invoice.vat_rate,
        wht_rate: invoice.wht_rate,
        notes: invoice.notes ?? "",
      });
    } else {
      reset(getDefaultValues(defaultProjectId));
    }
  }, [invoice, defaultProjectId, reset]);

  const { data: projectsData } = useProjects({ limit: 100 });
  const projectOptions =
    projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];

  const selectedProjectId = watch("project_id");
  const { data: phasesData } = usePhases(selectedProjectId || null, { page: 1, limit: 100 });
  const phaseOptions = [
    { value: "", label: "No specific phase" },
    ...(phasesData?.phases?.map((ph) => ({
      value: String(ph.id),
      label: `${ph.title} (${new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(ph.amount)})`,
    })) ?? []),
  ];

  const watchedSubtotal = watch("subtotal");
  const watchedVatRate = watch("vat_rate");
  const watchedWhtRate = watch("wht_rate");
  const vatAmount = (watchedSubtotal || 0) * (watchedVatRate || 0) / 100;
  const whtAmount = (watchedSubtotal || 0) * (watchedWhtRate || 0) / 100;
  const totalAmount = (watchedSubtotal || 0) + vatAmount - whtAmount;

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Controller
        name="project_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Project *"
            options={projectOptions}
            placeholder="Choose project"
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
            onChange={(v) => {
              field.onChange(v);
              const phase = phasesData?.phases?.find((ph) => String(ph.id) === v);
              if (phase) setValue("subtotal", phase.amount);
            }}
          />
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Issue date *" type="date" error={errors.issue_date?.message} {...register("issue_date")} />
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
      <div className="rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">VAT amount</span>
          <span>{new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(vatAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">WHT amount</span>
          <span>−{new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(whtAmount)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-1 font-medium">
          <span>Total</span>
          <span>{new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(totalAmount)}</span>
        </div>
      </div>
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
