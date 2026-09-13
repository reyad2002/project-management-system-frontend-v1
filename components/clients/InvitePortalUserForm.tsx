"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

export type InvitePortalUserFormData = z.infer<typeof schema>;

interface InvitePortalUserFormProps {
  formId: string;
  onSubmit: (data: InvitePortalUserFormData) => Promise<void>;
}

export function InvitePortalUserForm({ formId, onSubmit }: InvitePortalUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitePortalUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Input label="Contact name *" error={errors.name?.message} {...register("name")} />
      <Input label="Email *" type="email" error={errors.email?.message} {...register("email")} />
      <p className="text-xs text-(--muted)">
        An invite link will be sent to this email to set up their portal login.
      </p>
    </form>
  );
}
