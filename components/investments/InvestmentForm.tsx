"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { Investment } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  amount_invested: z.number().positive("Amount must be positive"),
  investment_date: z.string().min(1, "Date is required"),
  status: z.enum(["active", "closed"]),
  notes: z.string().optional(),
});

export type InvestmentFormData = z.infer<typeof schema>;

interface InvestmentFormProps {
  investment?: Investment | null;
  formId: string;
  onSubmit: (data: InvestmentFormData) => Promise<void>;
}

const defaultValues: InvestmentFormData = {
  name: "",
  amount_invested: 0,
  investment_date: "",
  status: "active",
  notes: "",
};

export function InvestmentForm({ investment, formId, onSubmit }: InvestmentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (investment) {
      reset({
        name: investment.name,
        amount_invested: investment.amount_invested,
        investment_date: investment.investment_date,
        status: investment.status,
        notes: investment.notes ?? "",
      });
    } else {
      reset(defaultValues);
    }
  }, [investment, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Input label="Name *" placeholder="What was invested in" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount invested *"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount_invested?.message}
          {...register("amount_invested", { valueAsNumber: true })}
        />
        <Input label="Invested date *" type="date" error={errors.investment_date?.message} {...register("investment_date")} />
      </div>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Status *"
            options={[
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
            ]}
            error={errors.status?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <Textarea label="Notes" error={errors.notes?.message} {...register("notes")} />
    </form>
  );
}
