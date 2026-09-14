import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  /** Lucide icon rendered in the tinted disc. Defaults to an inbox. */
  icon?: LucideIcon;
  title: string;
  /** One line explaining why the list is empty or what to do next. */
  description?: string;
  /** Primary action — usually the same Button that sits in the page header. */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--muted-bg)] text-[var(--muted)]"
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
