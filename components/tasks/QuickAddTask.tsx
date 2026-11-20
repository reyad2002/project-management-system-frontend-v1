"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, Flag, Plus, User } from "lucide-react";
import { useCreateAnyTask } from "@/hooks/use-tasks";
import { useUsersShortList } from "@/hooks/use-users";
import { useAuth } from "@/lib/auth-context";
import { parseQuickAdd } from "@/lib/quick-add";

interface QuickAddTaskProps {
  /** Tasks added here go to this project (omit for internal tasks). */
  projectId?: string;
}

// The person's own calendar day (late evening in Cairo is already "tomorrow" in UTC terms otherwise).
const today = () => new Date().toLocaleDateString("en-CA");

/**
 * A one-line task box at the top of a task list: type, press Enter, done. Understands @person, !priority
 * and dates like "tomorrow", "fri", "+3", "12/1" (shown as chips before saving).
 */
export function QuickAddTask({ projectId }: QuickAddTaskProps) {
  const { user } = useAuth();
  const { data: usersData } = useUsersShortList();
  const create = useCreateAnyTask();
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const people = useMemo(() => (usersData?.users ?? []).map((u) => ({ id: String(u.id), name: u.name })), [usersData]);
  const parsed = useMemo(() => parseQuickAdd(text, people, today()), [text, people]);

  const submit = () => {
    if (!parsed.title || create.isPending) return;
    create.mutate(
      {
        title: parsed.title,
        project_id: projectId ?? null,
        priority: parsed.priority ?? "medium",
        status: "todo",
        // Nobody named: it's the writer's own task.
        assignee_id: parsed.assignee?.id ?? (user?.id ? String(user.id) : null),
        due_date: parsed.dueDate ?? null,
      },
      {
        onSuccess: () => {
          setText("");
          ref.current?.focus();
        },
      },
    );
  };

  const chip = "inline-flex items-center gap-1 rounded-full bg-(--muted-bg) px-2 py-0.5 text-xs text-(--foreground)";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--card) px-3 focus-within:border-(--ring) focus-within:ring-2 focus-within:ring-(--ring)/20">
        <Plus className="h-4 w-4 shrink-0 text-(--muted)" />
        <input
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              setText("");
            }
          }}
          placeholder='Quick add: "Send the invoice tomorrow @sara !high" then Enter'
          aria-label="Quick add a task"
          maxLength={300}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-(--foreground) outline-none placeholder:text-(--muted) sm:text-sm"
        />
        {create.isPending && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />}
      </div>
      {text.trim() && (parsed.assignee || parsed.priority || parsed.dueDate || parsed.unknownMentions.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {parsed.dueDate && (
            <span className={chip}>
              <CalendarDays className="h-3 w-3" /> {parsed.dueDate}
            </span>
          )}
          {parsed.assignee && (
            <span className={chip}>
              <User className="h-3 w-3" /> {parsed.assignee.name}
            </span>
          )}
          {parsed.priority && (
            <span className={chip}>
              <Flag className="h-3 w-3" /> {parsed.priority}
            </span>
          )}
          {parsed.unknownMentions.map((m) => (
            <span key={m} className="rounded-full bg-(--warning-bg) px-2 py-0.5 text-xs text-(--warning)">
              {m}: nobody by that name
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
