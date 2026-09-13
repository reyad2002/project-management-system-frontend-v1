"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PROJECT_MEMBER_ROLES } from "@/lib/constants";

const schema = z.object({
  user_id: z.string().min(1, "Team member is required"),
  role_in_project: z.enum(["owner", "manager", "contributor", "viewer"]),
  allocation_percent: z.union([z.string(), z.number()]).optional(),
});

export type AddMemberFormData = z.infer<typeof schema>;

interface AddMemberFormProps {
  formId: string;
  userOptions: { value: string; label: string }[];
  onSubmit: (data: AddMemberFormData) => Promise<void>;
}

export function AddMemberForm({ formId, userOptions, onSubmit }: AddMemberFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(schema),
    defaultValues: { user_id: "", role_in_project: "contributor", allocation_percent: "" },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Controller
        name="user_id"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Team member *"
            options={userOptions}
            placeholder="Choose a team member"
            searchable
            error={errors.user_id?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <Controller
        name="role_in_project"
        control={control}
        render={({ field }) => (
          <CustomSelect
            label="Role on this project *"
            options={PROJECT_MEMBER_ROLES.map((r) => ({ value: r.value, label: r.label }))}
            placeholder="Select role"
            error={errors.role_in_project?.message}
            {...field}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <Input
        label="Allocation (%)"
        type="number"
        step="1"
        min="0"
        max="100"
        placeholder="e.g. 50"
        error={errors.allocation_percent?.message}
        {...register("allocation_percent")}
      />
    </form>
  );
}
