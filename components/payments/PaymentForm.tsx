"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Payment } from "@/lib/api";

const schema = z.object({
  project_id: z.string().min(1, "Project is required"),
  amount: z.number().positive("Amount must be positive"),
  payment_date: z.string().min(1, "Date is required"),
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "other"]),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof schema>;

interface PaymentFormProps {
  payment?: Payment | null;
  projectOptions: { value: string; label: string }[];
  defaultProjectId?: string;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const getDefaultValues = (
  payment?: Payment | null,
  defaultProjectId?: string
): PaymentFormData => ({
  project_id: payment?.project_id != null ? String(payment.project_id) : (defaultProjectId ?? ""),
  amount: payment?.amount ?? 0,
  payment_date: payment?.payment_date ?? new Date().toISOString().slice(0, 10),
  payment_method: payment?.payment_method ?? "cash",
  notes: payment?.notes ?? "",
});

export function PaymentForm({
  payment,
  projectOptions,
  defaultProjectId,
  onSubmit,
  onCancel,
  isLoading,
}: PaymentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(undefined, defaultProjectId),
  });

  useEffect(() => {
    reset(getDefaultValues(payment, defaultProjectId));
  }, [payment, defaultProjectId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        name="project_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Project *"
            options={projectOptions}
            placeholder="Choose project"
            error={errors.project_id?.message}
            {...field}
            value={field.value != null ? String(field.value) : ""}
            onChange={(v) => field.onChange(v != null ? String(v) : "")}
          />
        )}
      />
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
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" loading={isLoading}>
          {payment ? "Update" : "Create"}
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
