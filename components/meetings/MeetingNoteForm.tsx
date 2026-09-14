"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useUsersShortList } from "@/hooks/use-users";
import { useClientPortalUsers } from "@/hooks/use-client-portal";
import type { ActionItemInput } from "@/lib/api";

const actionItemSchema = z.object({
  title: z.string().min(1, "Required"),
  assignee_type: z.enum(["team_member", "client"]),
  assignee_id: z.string().min(1, "Required"),
  due_date: z.string().optional(),
});

const schema = z.object({
  content: z.string().min(1, "Note content is required"),
  action_items: z.array(actionItemSchema),
});

export type MeetingNoteFormData = z.infer<typeof schema>;

interface MeetingNoteFormProps {
  clientId: string;
  formId: string;
  onSubmit: (data: { content: string; action_items?: ActionItemInput[] }) => Promise<void>;
}

export function MeetingNoteForm({ clientId, formId, onSubmit }: MeetingNoteFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MeetingNoteFormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: "", action_items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "action_items" });
  const { data: usersData } = useUsersShortList();
  const { data: portalUsersData } = useClientPortalUsers(clientId);

  const submit = handleSubmit((data) =>
    onSubmit({
      content: data.content,
      action_items: data.action_items.length ? data.action_items : undefined,
    })
  );

  return (
    <form id={formId} onSubmit={submit} className="form-stagger space-y-5">
      <Textarea
        label="Meeting notes *"
        rows={8}
        placeholder="Write the meeting minutes (markdown supported)..."
        error={errors.content?.message}
        {...register("content")}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-(--foreground)">Action items</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: "", assignee_type: "team_member", assignee_id: "", due_date: "" })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add item
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-(--muted)">No action items yet.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const assigneeType = watch(`action_items.${index}.assignee_type`);
              const options =
                assigneeType === "client"
                  ? (portalUsersData?.portalUsers ?? []).map((u) => ({ value: String(u.id), label: u.name }))
                  : (usersData?.users ?? []).map((u) => ({ value: String(u.id), label: u.name }));
              return (
                <div key={field.id} className="rounded-lg border border-(--card-border) p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      placeholder="Action item title"
                      error={errors.action_items?.[index]?.title?.message}
                      {...register(`action_items.${index}.title`)}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-(--destructive)" />
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Controller
                      name={`action_items.${index}.assignee_type`}
                      control={control}
                      render={({ field: f }) => (
                        <CustomSelect
                          label="Assign to"
                          options={[
                            { value: "team_member", label: "Team member" },
                            { value: "client", label: "Client" },
                          ]}
                          {...f}
                          onChange={(v) => {
                            f.onChange(v);
                          }}
                        />
                      )}
                    />
                    <Controller
                      name={`action_items.${index}.assignee_id`}
                      control={control}
                      render={({ field: f }) => (
                        <CustomSelect
                          label="Assignee"
                          options={options}
                          placeholder="Select..."
                          searchable
                          error={errors.action_items?.[index]?.assignee_id?.message}
                          {...f}
                          onChange={(v) => f.onChange(v)}
                        />
                      )}
                    />
                    <Input
                      label="Due date"
                      type="date"
                      {...register(`action_items.${index}.due_date`)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
}
