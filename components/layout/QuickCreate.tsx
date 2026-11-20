"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, CheckSquare, CreditCard, FileText, Plus, Receipt, Users } from "lucide-react";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ClientFormModal } from "@/app/dashboard/clients/ClientFormModal";
import { ProjectFormModal } from "@/app/dashboard/projects/ProjectFormModal";
import { InvoiceFormModal } from "@/app/dashboard/invoices/InvoiceFormModal";
import { PaymentFormModal } from "@/app/dashboard/payments/PaymentFormModal";
import { ExpenseFormModal } from "@/app/dashboard/expenses/ExpenseFormModal";
import { useClientsShortList } from "@/hooks/use-clients";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";

export type QuickCreateKind = "task" | "client" | "project" | "invoice" | "payment" | "expense";

/** Open a "new ..." form from anywhere (keyboard shortcuts use this). */
export function openQuickCreate(kind: QuickCreateKind) {
  window.dispatchEvent(new CustomEvent<QuickCreateKind>("quick-create", { detail: kind }));
}

const ITEMS: { kind: QuickCreateKind; label: string; icon: typeof Plus; finance?: boolean; hint?: string }[] = [
  { kind: "task", label: "Task", icon: CheckSquare, hint: "N" },
  { kind: "client", label: "Client", icon: Users },
  { kind: "project", label: "Project", icon: Briefcase },
  { kind: "invoice", label: "Invoice", icon: FileText, finance: true },
  { kind: "payment", label: "Payment", icon: CreditCard, finance: true },
  { kind: "expense", label: "Expense", icon: Receipt, finance: true },
];

/** The "+" in the header: create anything without leaving the page you are on. */
export function QuickCreate() {
  const { user } = useAuth();
  const finance = can(user, "finance");
  const [menuOpen, setMenuOpen] = useState(false);
  const [kind, setKind] = useState<QuickCreateKind | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { data: clients } = useClientsShortList();

  useEffect(() => {
    const onOpen = (e: Event) => setKind((e as CustomEvent<QuickCreateKind>).detail);
    window.addEventListener("quick-create", onOpen);
    return () => window.removeEventListener("quick-create", onOpen);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const close = () => setKind(null);
  const clientOptions = clients?.clients?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Create new"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Create new"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-(--primary) text-(--primary-foreground) shadow-sm transition-colors hover:bg-(--primary-hover)"
      >
        <Plus className="h-5 w-5" />
      </button>

      {menuOpen && (
        <div role="menu" className="absolute end-0 top-11 z-40 w-52 rounded-2xl border border-(--border) bg-(--card) p-1.5 shadow-xl">
          {ITEMS.filter((i) => !i.finance || finance).map(({ kind: k, label, icon: Icon, hint }) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setKind(k);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm text-(--foreground) hover:bg-(--muted-bg)"
            >
              <Icon className="h-4 w-4 text-(--muted)" />
              <span className="flex-1">New {label.toLowerCase()}</span>
              {hint && <kbd className="rounded border border-(--border) px-1.5 text-[0.65rem] text-(--muted)">{hint}</kbd>}
            </button>
          ))}
        </div>
      )}

      <TaskFormModal open={kind === "task"} onClose={close} />
      {kind === "client" && <ClientFormModal open onClose={close} clientId={null} />}
      {kind === "project" && <ProjectFormModal open onClose={close} projectId={null} clientOptions={clientOptions} />}
      {finance && kind === "invoice" && <InvoiceFormModal open onClose={close} />}
      {finance && kind === "payment" && <PaymentFormModal open onClose={close} paymentId={null} />}
      {finance && kind === "expense" && <ExpenseFormModal open onClose={close} expenseId={null} />}
    </div>
  );
}
