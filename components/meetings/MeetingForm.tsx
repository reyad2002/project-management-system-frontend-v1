"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Meeting } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  agenda: z.string().optional(),
  scheduled_at: z.string().min(1, "Date & time is required"),
  meeting_link: z.string().optional(),
});

export type MeetingFormData = z.infer<typeof schema>;

interface MeetingFormProps {
  meeting?: Meeting | null;
  formId: string;
  onSubmit: (data: MeetingFormData) => Promise<void>;
}

const defaultValues: MeetingFormData = {
  title: "",
  agenda: "",
  scheduled_at: "",
  meeting_link: "",
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingForm({ meeting, formId, onSubmit }: MeetingFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (meeting) {
      reset({
        title: meeting.title,
        agenda: meeting.agenda ?? "",
        scheduled_at: toDatetimeLocal(meeting.scheduled_at),
        meeting_link: meeting.meeting_link ?? "",
      });
    } else {
      reset(defaultValues);
    }
  }, [meeting, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="form-stagger space-y-4">
      <Input label="Title *" error={errors.title?.message} {...register("title")} />
      <Textarea label="Agenda" error={errors.agenda?.message} {...register("agenda")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date & time *"
          type="datetime-local"
          error={errors.scheduled_at?.message}
          {...register("scheduled_at")}
        />
        <Input label="Meeting link" placeholder="https://..." error={errors.meeting_link?.message} {...register("meeting_link")} />
      </div>
    </form>
  );
}
