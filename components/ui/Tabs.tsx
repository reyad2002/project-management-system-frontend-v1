"use client";

import { useId, useRef, useState, type ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const tabId = (key: string) => `${baseId}-tab-${key}`;
  const panelId = (key: string) => `${baseId}-panel-${key}`;

  // Left/Right/Home/End move between tabs, as expected of a tablist.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = tabs.findIndex((t) => t.key === active);
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    e.preventDefault();
    const nextKey = tabs[nextIndex].key;
    setActive(nextKey);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(nextKey))}`)
      ?.focus();
  };

  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={handleKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)]"
      >
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              id={tabId(t.key)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId(t.key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(t.key)}
              className={`-mb-px shrink-0 rounded-t-md border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {activeTab && (
        <div
          id={panelId(activeTab.key)}
          role="tabpanel"
          aria-labelledby={tabId(activeTab.key)}
          tabIndex={0}
          className="pt-6"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
