"use client";

import type { TimelineItem } from "@/lib/api";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(d: string | null, fallback: Date) {
  return d ? new Date(d) : fallback;
}

interface PortalTimelineViewProps {
  items: TimelineItem[];
}

export function PortalTimelineView({ items: allItems }: PortalTimelineViewProps) {
  const items = allItems.filter((i) => i.start_date || i.due_date);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-(--muted)">No dated items yet.</p>
    );
  }

  const today = new Date();
  const starts = items.map((i) => toDate(i.start_date, toDate(i.due_date, today)).getTime());
  const ends = items.map((i) => toDate(i.due_date, toDate(i.start_date, today)).getTime());
  const rangeStart = Math.min(...starts, today.getTime());
  const rangeEnd = Math.max(...ends, today.getTime());
  const totalMs = Math.max(rangeEnd - rangeStart, DAY_MS);
  const todayLeftPercent = ((today.getTime() - rangeStart) / totalMs) * 100;

  const renderBar = (item: TimelineItem) => {
    const start = toDate(item.start_date, toDate(item.due_date, today)).getTime();
    const end = toDate(item.due_date, toDate(item.start_date, today)).getTime();
    const leftPercent = ((start - rangeStart) / totalMs) * 100;
    const widthPercent = Math.max(((end - start) / totalMs) * 100, 1.5);
    const isPhase = item.item_type === "phase";

    return (
      <div key={item.id} className="relative h-6">
        <div
          className="absolute top-0 h-6 overflow-hidden rounded"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: isPhase ? "var(--primary)" : "color-mix(in srgb, var(--accent) 35%, var(--muted-bg))",
          }}
          title={item.title}
        >
          {!isPhase && <div className="h-full rounded bg-(--accent)" style={{ width: `${item.progress_percent}%` }} />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1 overflow-x-auto">
      <div className="flex min-w-150 gap-3">
        <div className="w-40 shrink-0 space-y-1">
          {items.map((item) => (
            <div key={item.id} className="h-6 truncate text-sm leading-6 text-(--foreground)" title={item.title}>
              {item.item_type === "phase" ? "📌 " : "— "}
              {item.title}
            </div>
          ))}
        </div>
        <div className="relative flex-1 space-y-1">
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-(--destructive)"
            style={{ left: `${todayLeftPercent}%` }}
          />
          {items.map(renderBar)}
        </div>
      </div>
      <div className="flex items-center gap-4 pt-2 text-xs text-(--muted)">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-(--primary)" /> Phase
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-(--accent)" /> Task
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-(--destructive)" /> Today
        </span>
      </div>
    </div>
  );
}
