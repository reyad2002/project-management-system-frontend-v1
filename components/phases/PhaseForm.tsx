"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Phase } from "@/lib/api";

const schema = z
  .object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    amount: z.number().min(0, "Amount must be ≥ 0"),
    title: z.string().min(1, "Title is required"),
    notes: z.string().optional(),
  })
  .refine(
    (d) => !d.start_date || !d.end_date || new Date(d.end_date) >= new Date(d.start_date),
    { message: "End date must be on or after start date", path: ["end_date"] }
  );

export type PhaseFormData = z.infer<typeof schema>;

interface PhaseFormProps {
  phase?: Phase | null;
  formId: string;
  onSubmit: (data: PhaseFormData) => Promise<void>;
}

const defaultValues: PhaseFormData = {
  start_date: "",
  end_date: "",
  amount: 0,
  title: "",
  notes: "",
};

export function PhaseForm({ phase, formId, onSubmit }: PhaseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PhaseFormData>({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (phase) {
      reset({
        start_date: phase.start_date ?? "",
        end_date: phase.end_date ?? "",
        amount: phase.amount ?? 0,
        title: phase.title ?? "",
        notes: phase.notes ?? "",
      });
    } else {
      reset(defaultValues);
    }
  }, [phase, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Input
        label="Title *"
        error={errors.title?.message}
        {...register("title")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date *"
          type="date"
          error={errors.start_date?.message}
          {...register("start_date")}
        />
        <Input
          label="End date *"
          type="date"
          error={errors.end_date?.message}
          {...register("end_date")}
        />
      </div>
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />
      <Textarea
        label="Notes"
        error={errors.notes?.message}
        {...register("notes")}
      />
    </form>
  );
}
