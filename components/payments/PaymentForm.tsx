"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: payment?.project_id ?? defaultProjectId ?? "",
      amount: payment?.amount ?? undefined,
      payment_date: payment?.payment_date ?? new Date().toISOString().slice(0, 10),
      payment_method: payment?.payment_method ?? "cash",
      notes: payment?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Project *"
        options={projectOptions}
        error={errors.project_id?.message}
        {...register("project_id")}
      />
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
      <Select
        label="Payment method *"
        options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
        error={errors.payment_method?.message}
        {...register("payment_method")}
      />
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
      <div className="flex gap-2">
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
