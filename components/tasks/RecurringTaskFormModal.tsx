"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { TASK_PRIORITIES } from "@/lib/constants";
import { useProjectsShortList } from "@/hooks/use-projects";
import { useUsersShortList } from "@/hooks/use-users";
import { useSaveRecurringTask } from "@/hooks/use-task-templates";
import type { RecurringFrequency, RecurringTask, TaskPriority } from "@/lib/api";

// Values follow JS getDay() (0 = Sunday); listed starting from Saturday, the first day of the week here.
const WEEKDAYS = [
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
];

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: i + 1 === 31 ? "31 (the last day of shorter months)" : String(i + 1),
}));

const todayStr = () => new Date().toISOString().slice(0, 10);

interface RecurringTaskFormModalProps {
  onClose: () => void;
  /** Edit this rule; omit to create. */
  rule?: RecurringTask | null;
}

export function RecurringTaskFormModal({ onClose, rule }: RecurringTaskFormModalProps) {
  const save = useSaveRecurringTask();
  const { data: projectsData } = useProjectsShortList();
  const { data: usersData } = useUsersShortList();

  const [title, setTitle] = useState(rule?.title ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [projectId, setProjectId] = useState(rule?.project_id ? String(rule.project_id) : "");
  const [assigneeId, setAssigneeId] = useState(rule?.assignee_id ? String(rule.assignee_id) : "");
  const [priority, setPriority] = useState<TaskPriority>(rule?.priority ?? "medium");
  const [frequency, setFrequency] = useState<RecurringFrequency>(rule?.frequency ?? "monthly");
  const [weekday, setWeekday] = useState(rule?.weekday != null ? String(rule.weekday) : "6");
  const [dayOfMonth, setDayOfMonth] = useState(rule?.day_of_month != null ? String(rule.day_of_month) : "1");
  const [dueIn, setDueIn] = useState(String(rule?.due_in_days ?? 3));
  const [startDate, setStartDate] = useState(rule?.start_date ?? todayStr());
  const [endDate, setEndDate] = useState(rule?.end_date ?? "");
  const [checklist, setChecklist] = useState((rule?.checklist ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return setError("Give the task a title.");
    const due = Number(dueIn);
    if (!Number.isInteger(due) || due < 0 || due > 365) return setError("\"Due after\" must be a whole number of days, 0 to 365.");
    if (endDate && endDate < startDate) return setError("The end date must be on or after the start date.");
    setError(null);

    await save.mutateAsync({
      id: rule?.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId || null,
        assignee_id: assigneeId || null,
        priority,
        frequency,
        weekday: frequency === "weekly" ? Number(weekday) : null,
        day_of_month: frequency === "monthly" ? Number(dayOfMonth) : null,
        due_in_days: due,
        start_date: startDate,
        end_date: endDate || null,
        checklist: checklist.split("\n").map((l) => l.trim()).filter(Boolean),
      },
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={rule ? "Edit recurring task" : "New recurring task"}
      description="A new task is created automatically each time it comes round."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={save.isPending} onClick={submit}>
            {rule ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <CustomSelect
            label="Project"
            options={[{ value: "", label: "Internal (no project)" }, ...(projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [])]}
            value={projectId}
            searchable
            onChange={setProjectId}
          />
          <CustomSelect
            label="Assignee"
            options={[{ value: "", label: "Unassigned" }, ...(usersData?.users?.map((u) => ({ value: String(u.id), label: u.name })) ?? [])]}
            value={assigneeId}
            searchable
            onChange={setAssigneeId}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Repeats"
            options={[
              { value: "daily", label: "Every day" },
              { value: "weekly", label: "Every week" },
              { value: "monthly", label: "Every month" },
            ]}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          />
          {frequency === "weekly" && <Select label="On" options={WEEKDAYS} value={weekday} onChange={(e) => setWeekday(e.target.value)} />}
          {frequency === "monthly" && <Select label="On day" options={DAYS_OF_MONTH} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Priority"
            options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          />
          <Input label="Due after (days)" type="number" min={0} value={dueIn} onChange={(e) => setDueIn(e.target.value)} />
          <span />
          <Input label="Starts" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Ends (optional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <Textarea label="Checklist on each task (one item per line, optional)" rows={3} value={checklist} onChange={(e) => setChecklist(e.target.value)} />

        {error && <p className="rounded-lg bg-(--destructive-bg) px-3 py-2 text-sm text-(--destructive)">{error}</p>}
      </div>
    </Modal>
  );
}
