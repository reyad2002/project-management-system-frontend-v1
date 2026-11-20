"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Task } from "@/lib/api";

const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]; // the week starts on Saturday
const MAX_PER_DAY = 3;

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11" -> "November 2026" */
export function monthTitle(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** First and last day of a month, as YYYY-MM-DD. */
export function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${pad(last)}` };
}

/** The cells of the month grid: leading blanks, the days, trailing blanks. */
export function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0 = Sunday
  const lead = (first + 1) % 7; // Saturday-first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d += 1) cells.push(`${month}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface TasksCalendarProps {
  month: string;
  onMonthChange: (month: string) => void;
  tasks: Task[];
  today: string;
  onOpenTask: (id: string) => void;
  onAddOnDay: (date: string) => void;
  /** Show every task of that day (the "+N more" link). */
  onShowDay: (date: string) => void;
}

function chipClass(t: Task, today: string) {
  if (t.status === "done") return "bg-(--muted-bg) text-(--muted) line-through";
  if (t.due_date && t.due_date < today) return "bg-(--destructive-bg) text-(--destructive)";
  if (t.priority === "urgent" || t.priority === "high") return "bg-(--warning-bg) text-(--warning)";
  return "bg-(--accent-muted) text-(--primary)";
}

/** Tasks laid out by due date. Click a task to open it, or the + on a day to add one for that day. */
export function TasksCalendar({ month, onMonthChange, tasks, today, onOpenTask, onAddOnDay, onShowDay }: TasksCalendarProps) {
  const byDay = new Map<string, Task[]>();
  for (const task of tasks) if (task.due_date) (byDay.get(task.due_date) ?? byDay.set(task.due_date, []).get(task.due_date))!.push(task);
  const agendaDays = [...byDay.keys()].filter((d) => d.startsWith(month)).sort();
  const dayLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" aria-label="Previous month" onClick={() => onMonthChange(shiftMonth(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" aria-label="Next month" onClick={() => onMonthChange(shiftMonth(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(today.slice(0, 7))}>
            Today
          </Button>
        </div>
        <h2 className="text-base font-semibold text-(--foreground)">{monthTitle(month)}</h2>
      </div>

      {/* Phones: a day-by-day list instead of a seven-column grid. */}
      <div className="md:hidden">
        {agendaDays.length === 0 ? (
          <p className="py-6 text-center text-sm text-(--muted)">No tasks due this month.</p>
        ) : (
          <ul className="space-y-3">
            {agendaDays.map((date) => (
              <li key={date}>
                <p className={`mb-1 text-xs font-semibold ${date === today ? "text-(--primary)" : "text-(--muted)"}`}>{dayLabel(date)}</p>
                <ul className="space-y-1">
                  {(byDay.get(date) ?? []).map((task) => (
                    <li key={task.id}>
                      <button type="button" onClick={() => onOpenTask(String(task.id))} className={`block w-full truncate rounded-lg px-3 py-2 text-start text-sm ${chipClass(task, today)}`}>
                        {task.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="grid min-w-[44rem] grid-cols-7 gap-px overflow-hidden rounded-xl border border-(--card-border) bg-(--card-border)">
          {WEEKDAYS.map((d) => (
            <div key={d} className="bg-(--muted-bg) px-2 py-1.5 text-center text-xs font-medium text-(--muted)">
              {d}
            </div>
          ))}
          {monthCells(month).map((date, i) => {
            if (!date) return <div key={`blank-${i}`} className="min-h-24 bg-(--muted-bg)/40" />;
            const dayTasks = byDay.get(date) ?? [];
            return (
              <div key={date} className="group min-h-24 bg-(--card) p-1.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`num flex h-6 w-6 items-center justify-center rounded-full text-xs ${date === today ? "bg-(--primary) font-semibold text-white" : "text-(--muted)"}`}>{Number(date.slice(8))}</span>
                  <button
                    type="button"
                    aria-label={`Add a task on ${date}`}
                    onClick={() => onAddOnDay(date)}
                    className="rounded p-0.5 text-(--muted) opacity-0 transition-opacity hover:text-(--primary) focus:opacity-100 group-hover:opacity-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ul className="space-y-1">
                  {dayTasks.slice(0, MAX_PER_DAY).map((t) => (
                    <li key={t.id}>
                      <button type="button" onClick={() => onOpenTask(String(t.id))} title={t.title} className={`block w-full truncate rounded px-1.5 py-0.5 text-start text-xs ${chipClass(t, today)}`}>
                        {t.title}
                      </button>
                    </li>
                  ))}
                </ul>
                {dayTasks.length > MAX_PER_DAY && (
                  <button type="button" onClick={() => onShowDay(date)} className="mt-1 text-xs font-medium text-(--primary) hover:underline">
                    +{dayTasks.length - MAX_PER_DAY} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
