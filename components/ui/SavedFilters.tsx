"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDeleteSavedFilter, useSaveFilter, useSavedFilters } from "@/hooks/use-saved-filters";
import type { FilterValue, SavedFilterPage } from "@/lib/api";

/** Keep only the filters that are actually set. */
export function setOnly(values: Record<string, FilterValue | null | undefined>): Record<string, FilterValue> {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false)) as Record<string, FilterValue>;
}

interface SavedFiltersProps {
  page: SavedFilterPage;
  /** The filters currently set (only the ones that differ from the page's defaults). */
  current: Record<string, FilterValue>;
  /** Put a saved set back on the page. Filters missing from `params` go back to the page's defaults. */
  onApply: (params: Record<string, FilterValue>) => void;
}

/**
 * "Saved views" next to the filters: save what you have set under a name ("My overdue tasks"), and bring it
 * back with one click. They are yours alone.
 */
export function SavedFilters({ page, current, onApply }: SavedFiltersProps) {
  const { data } = useSavedFilters(page);
  const save = useSaveFilter(page);
  const remove = useDeleteSavedFilter(page);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filters = data?.filters ?? [];
  const canSave = Object.keys(current).length > 0;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || !canSave) return;
    await save.mutateAsync({ name: trimmed, params: current });
    setName("");
  };

  return (
    <div className="relative" ref={ref}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Saved views">
        <Bookmark className="h-4 w-4" />
        <span className="ms-2 hidden sm:inline">Saved views</span>
        {filters.length > 0 && <span className="num ms-1.5 rounded-full bg-(--muted-bg) px-1.5 text-xs">{filters.length}</span>}
      </Button>

      {open && (
        <div className="absolute end-0 top-11 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-(--border) bg-(--card) p-3 shadow-xl">
          {filters.length === 0 ? (
            <p className="px-1 pb-2 text-sm text-(--muted)">No saved views yet.</p>
          ) : (
            <ul className="mb-2 max-h-56 space-y-0.5 overflow-auto">
              {filters.map((f) => (
                <li key={f.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(f.params);
                      setOpen(false);
                    }}
                    className="min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-start text-sm text-(--foreground) hover:bg-(--muted-bg)"
                  >
                    {f.name}
                  </button>
                  <button type="button" aria-label="Delete saved view" onClick={() => remove.mutate(f.id)} className="shrink-0 rounded p-1.5 text-(--muted) hover:text-(--destructive)">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-(--border-subtle) pt-3">
            <p className="mb-1.5 text-xs font-medium text-(--muted)">{canSave ? "Save the filters you have set" : "Set some filters first, then save them here"}</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void submit())}
                placeholder="Name, e.g. My overdue tasks"
                aria-label="Name"
                maxLength={60}
                disabled={!canSave}
                className="h-9 min-w-0 flex-1 rounded-lg border border-(--border) bg-(--card) px-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20 disabled:opacity-50"
              />
              <Button type="button" size="sm" loading={save.isPending} disabled={!canSave || !name.trim()} onClick={submit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
