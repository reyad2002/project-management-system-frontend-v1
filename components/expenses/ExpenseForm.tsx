"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Textarea } from "@/components/ui/Textarea";
import { EXPENSE_TYPES } from "@/lib/constants";
import type { Expense } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  expense_date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["direct", "operational"]),
});

export type ExpenseFormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const defaultEmpty: ExpenseFormData = {
  amount: 0,
  expense_date: new Date().toISOString().slice(0, 10),
  title: "",
  description: "",
  type: "direct",
};

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount,
        expense_date: expense.expense_date ?? defaultEmpty.expense_date,
        title: expense.title ?? "",
        description: expense.description ?? "",
        type: expense.type ?? "direct",
      });
    } else {
      reset(defaultEmpty);
    }
  }, [expense, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        label="Expense date *"
        type="date"
        error={errors.expense_date?.message}
        {...register("expense_date")}
      />
      </div>
      <Textarea label="Description" error={errors.description?.message} {...register("description")} />
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Type *"
            options={EXPENSE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            placeholder="Select type"
            error={errors.type?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" loading={isLoading}>
          {expense ? "Update" : "Create"}
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
