"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useUsersShortList } from "@/hooks/use-users";
import { useClientPortalUsers } from "@/hooks/use-client-portal";
import type { Meeting } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  agenda: z.string().optional(),
  scheduled_at: z.string().min(1, "Date & time is required"),
  meeting_link: z.string().optional(),
  team_member_ids: z.array(z.string()),
  client_portal_user_ids: z.array(z.string()),
});

export type MeetingFormData = z.infer<typeof schema>;

interface MeetingFormProps {
  meeting?: Meeting | null;
  clientId: string;
  formId: string;
  onSubmit: (data: MeetingFormData) => Promise<void>;
}

const defaultValues: MeetingFormData = {
  title: "",
  agenda: "",
  scheduled_at: "",
  meeting_link: "",
  team_member_ids: [],
  client_portal_user_ids: [],
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingForm({ meeting, clientId, formId, onSubmit }: MeetingFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { data: usersData } = useUsersShortList();
  const { data: portalUsersData } = useClientPortalUsers(clientId);

  useEffect(() => {
    if (meeting) {
      reset({
        title: meeting.title,
        agenda: meeting.agenda ?? "",
        scheduled_at: toDatetimeLocal(meeting.scheduled_at),
        meeting_link: meeting.meeting_link ?? "",
        team_member_ids: [],
        client_portal_user_ids: [],
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="team_member_ids"
          control={control}
          render={({ field }) => (
            <div>
              <p className="mb-1 text-xs font-medium text-(--muted)">Team attendees</p>
              <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-(--border) p-2">
                {usersData?.users?.length ? (
                  usersData.users.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value.includes(String(u.id))}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                              ? [...field.value, String(u.id)]
                              : field.value.filter((id) => id !== String(u.id))
                          )
                        }
                      />
                      {u.name}
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-(--muted)">No team members yet.</p>
                )}
              </div>
            </div>
          )}
        />
        <Controller
          name="client_portal_user_ids"
          control={control}
          render={({ field }) => (
            <div>
              <p className="mb-1 text-xs font-medium text-(--muted)">Client attendees</p>
              <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-(--border) p-2">
                {portalUsersData?.portalUsers?.length ? (
                  portalUsersData.portalUsers.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value.includes(String(u.id))}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                              ? [...field.value, String(u.id)]
                              : field.value.filter((id) => id !== String(u.id))
                          )
                        }
                      />
                      {u.name}
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-(--muted)">No client portal users invited yet.</p>
                )}
              </div>
            </div>
          )}
        />
      </div>
    </form>
  );
}
