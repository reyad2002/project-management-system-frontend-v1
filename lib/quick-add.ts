/**
 * Quick add: one line becomes a task.
 *   "Send the invoice tomorrow @sara !high"  ->  title "Send the invoice", due tomorrow, Sara, high priority
 *
 * Understood (anywhere in the line, case-insensitive):
 *   @name             assignee (first name, any part of the name, or the start of it)
 *   !low !medium !high !urgent  (or !l !m !h !u)   priority
 *   today, tomorrow (tmr), a weekday (mon / monday ...), +3 / +3d (days), +2w (weeks),
 *   2026-12-01, 1/12 (day/month)                    due date
 * Everything else is the title. Pure, so it can be tested on its own.
 */
export type QuickPriority = "low" | "medium" | "high" | "urgent";

export interface QuickPerson {
  id: string;
  name: string;
}

export interface QuickAddResult {
  title: string;
  assignee?: QuickPerson;
  priority?: QuickPriority;
  dueDate?: string;
  /** "@xyz" that matched nobody: shown so the person can fix it. */
  unknownMentions: string[];
}

const PRIORITIES: Record<string, QuickPriority> = { low: "low", l: "low", medium: "medium", med: "medium", m: "medium", high: "high", h: "high", urgent: "urgent", u: "urgent" };
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DAY_MS = 86_400_000;
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) => fmt(new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY_MS));

function weekdayIndex(word: string): number {
  if (word.length < 3) return -1;
  return WEEKDAYS.findIndex((d) => d.startsWith(word));
}

/** A due-date word, or null if the word is not one. `today` is YYYY-MM-DD. */
export function parseDateWord(word: string, today: string): string | null {
  const w = word.toLowerCase();
  if (w === "today" || w === "tod") return today;
  if (w === "tomorrow" || w === "tmr" || w === "tmrw") return addDays(today, 1);
  let m = /^\+(\d{1,3})(d|w)?$/.exec(w);
  if (m) return addDays(today, Number(m[1]) * (m[2] === "w" ? 7 : 1));
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(w);
  if (m) {
    const d = new Date(`${w}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && fmt(d) === w ? w : null; // 2026-02-30 is not a date
  }
  m = /^(\d{1,2})\/(\d{1,2})$/.exec(w);
  if (m) {
    const [day, month] = [Number(m[1]), Number(m[2])];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const year = Number(today.slice(0, 4));
    const pad = (n: number) => String(n).padStart(2, "0");
    let candidate = `${year}-${pad(month)}-${pad(day)}`;
    if (fmt(new Date(`${candidate}T00:00:00Z`)) !== candidate) return null; // 31/4 and the like
    if (candidate < today) candidate = `${year + 1}-${pad(month)}-${pad(day)}`;
    return candidate;
  }
  const wd = weekdayIndex(w);
  if (wd >= 0) {
    const current = new Date(`${today}T00:00:00Z`).getUTCDay();
    const ahead = (wd - current + 7) % 7 || 7; // "fri" on a Friday means next Friday
    return addDays(today, ahead);
  }
  return null;
}

/** Best match for "@word" among the people. */
export function findPerson(word: string, people: QuickPerson[]): QuickPerson | undefined {
  const w = word.toLowerCase();
  if (!w) return undefined;
  const parts = (p: QuickPerson) => p.name.toLowerCase().split(/\s+/);
  return (
    people.find((p) => parts(p)[0] === w) ??
    people.find((p) => parts(p).includes(w)) ??
    people.find((p) => p.name.toLowerCase().replace(/\s+/g, "") === w) ??
    people.find((p) => parts(p).some((x) => x.startsWith(w)))
  );
}

export function parseQuickAdd(input: string, people: QuickPerson[], today: string): QuickAddResult {
  const result: QuickAddResult = { title: "", unknownMentions: [] };
  const kept: string[] = [];
  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    if (token.startsWith("@") && token.length > 1) {
      const person = findPerson(token.slice(1), people);
      if (person && !result.assignee) {
        result.assignee = person;
        continue;
      }
      if (!person) result.unknownMentions.push(token);
    } else if (token.startsWith("!") && PRIORITIES[token.slice(1).toLowerCase()]) {
      result.priority = PRIORITIES[token.slice(1).toLowerCase()];
      continue;
    } else if (!result.dueDate) {
      const date = parseDateWord(token, today);
      if (date) {
        result.dueDate = date;
        continue;
      }
    }
    kept.push(token);
  }
  result.title = kept.join(" ");
  return result;
}
