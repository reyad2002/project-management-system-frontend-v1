"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { useClientsShortList } from "@/hooks/use-clients";
import { useProjectsShortList } from "@/hooks/use-projects";
import { useUsersShortList } from "@/hooks/use-users";
import { useAllTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";

const DISMISSED = "getting-started-dismissed";

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED) === "1";
  } catch {
    return false;
  }
}

/**
 * First days with the system: the few steps that make it useful, ticked off as they happen.
 * Owners and admins only; it hides itself once everything is done, or when closed.
 */
export function GettingStarted() {
  const { user } = useAuth();
  const admin = can(user, "accounts");
  const [dismissed, setDismissed] = useState(wasDismissed);
  const { data: clients } = useClientsShortList();
  const { data: projects } = useProjectsShortList();
  const { data: users } = useUsersShortList();
  const { data: tasks } = useAllTasks({ limit: 1 }, { enabled: admin && !dismissed });

  if (!admin || dismissed || !clients || !projects || !users || !tasks) return null;

  const steps = [
    { done: (clients.clients?.length ?? 0) > 0, label: "Add your first client", href: "/dashboard/clients" },
    { done: (projects.projects?.length ?? 0) > 0, label: "Create a project (and apply a task template to it)", href: "/dashboard/projects" },
    { done: (users.users?.length ?? 0) > 1, label: "Add your team so you can assign work", href: "/dashboard/accounts" },
    { done: tasks.total > 0, label: "Create a task (press N anywhere)", href: "/dashboard/tasks" },
  ];
  if (steps.every((s) => s.done)) return null;
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-(--foreground)">Getting started</p>
            <p className="text-sm text-(--muted)">
              {doneCount} of {steps.length} done
            </p>
          </div>
          <button
            type="button"
            aria-label="Hide getting started"
            onClick={() => {
              setDismissed(true);
              try {
                window.localStorage.setItem(DISMISSED, "1");
              } catch {
                /* storage unavailable */
              }
            }}
            className="rounded p-1 text-(--muted) hover:text-(--foreground)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-1">
          {steps.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-(--muted-bg)">
                {s.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-(--success)" /> : <Circle className="h-5 w-5 shrink-0 text-(--muted)" />}
                <span className={s.done ? "text-(--muted) line-through" : "text-(--foreground)"}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
