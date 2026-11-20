"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { lastUsed } from "@/lib/last-used";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useInvoices } from "@/hooks/use-invoices";
import type { Payment } from "@/lib/api";

const schema = z.object({
  project_id: z.string().min(1, "Project is required"),
  invoice_id: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  payment_date: z.string().min(1, "Date is required"),
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "other"]),
  notes: z.string().optional(),
}).refine((d) => d.payment_method !== "cash" || !!d.notes?.trim(), {
  message: "Cash payments need a note (who received it / receipt no.)",
  path: ["notes"],
});

export type PaymentFormData = z.infer<typeof schema>;

interface PaymentFormProps {
  payment?: Payment | null;
  projectOptions: { value: string; label: string }[];
  defaultProjectId?: string;
  defaultInvoiceId?: string;
  formId: string;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onOverpayingChange?: (isOverpaying: boolean) => void;
}

const getDefaultValues = (
  payment?: Payment | null,
  defaultProjectId?: string,
  defaultInvoiceId?: string
): PaymentFormData => ({
  project_id: payment?.project_id != null ? String(payment.project_id) : (defaultProjectId ?? ""),
  invoice_id: payment?.invoice_id != null ? String(payment.invoice_id) : (defaultInvoiceId ?? ""),
  amount: payment?.amount ?? 0,
  payment_date: payment?.payment_date ?? new Date().toISOString().slice(0, 10),
  payment_method: payment?.payment_method ?? lastUsed("payment_method", "cash", ["cash", "bank_transfer", "credit_card", "other"]),
  notes: payment?.notes ?? "",
});

export function PaymentForm({
  payment,
  projectOptions,
  defaultProjectId,
  defaultInvoiceId,
  formId,
  onSubmit,
  onOverpayingChange,
}: PaymentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(undefined, defaultProjectId, defaultInvoiceId),
  });

  useEffect(() => {
    reset(getDefaultValues(payment, defaultProjectId, defaultInvoiceId));
  }, [payment, defaultProjectId, defaultInvoiceId, reset]);

  const selectedProjectId = watch("project_id");
  const selectedInvoiceId = watch("invoice_id");
  const { data: invoicesData } = useInvoices(
    selectedProjectId ? { project_id: selectedProjectId, limit: 100 } : undefined
  );
  const openInvoices = (invoicesData?.invoices ?? []).filter(
    (inv) => inv.status !== "paid" && inv.status !== "cancelled"
  );
  const invoiceOptions = [
    { value: "", label: "No invoice (advance payment)" },
    ...openInvoices.map((inv) => ({
      value: String(inv.id),
      label: `${inv.invoice_number} · remaining ${new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(inv.remaining_amount)}`,
    })),
  ];
  const selectedInvoice = openInvoices.find((inv) => String(inv.id) === selectedInvoiceId);
  const watchedAmount = watch("amount");
  const watchedMethod = watch("payment_method");
  const isOverpaying = !!selectedInvoice && watchedAmount > selectedInvoice.remaining_amount;

  useEffect(() => {
    onOverpayingChange?.(isOverpaying);
  }, [isOverpaying, onOverpayingChange]);

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
            value={field.value != null ? String(field.value) : ""}
            onChange={(v) => {
              field.onChange(v != null ? String(v) : "");
              setValue("invoice_id", "");
            }}
          />
        )}
      />
      <Controller
        name="invoice_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Invoice"
            options={invoiceOptions}
            placeholder="No invoice (advance payment)"
            disabled={!selectedProjectId}
            error={errors.invoice_id?.message}
            {...field}
            value={field.value != null ? String(field.value) : ""}
            onChange={(v) => field.onChange(v != null ? String(v) : "")}
          />
        )}
      />
      {selectedInvoice && (
        <p className={`text-xs ${isOverpaying ? "text-[var(--destructive)]" : "text-[var(--muted)]"}`}>
          Remaining balance on this invoice:{" "}
          {new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(
            selectedInvoice.remaining_amount
          )}
          {isOverpaying && " — amount exceeds the remaining balance"}
        </p>
      )}
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
          label="Payment date *"
          type="date"
          error={errors.payment_date?.message}
          {...register("payment_date")}
        />
      </div>
      <Controller
        name="payment_method"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Payment method *"
            options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
            placeholder="Select method"
            error={errors.payment_method?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <Textarea
        label={watchedMethod === "cash" ? "Notes * (who received the cash / receipt no.)" : "Notes"}
        error={errors.notes?.message}
        {...register("notes")}
      />
    </form>
  );
}
