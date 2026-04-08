"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  Receipt,
  Wallet,
  LogOut,
  X,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-56 flex-col bg-(--sidebar-bg) text-(--sidebar-foreground) shadow-lg transition-transform duration-200 ease-out md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-(--sidebar-hover) px-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-wide"
            onClick={handleLinkClick}
          >
            PMS
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-(--sidebar-foreground) transition-colors hover:bg-(--sidebar-hover) md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto p-2">
          {nav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-(--sidebar-active) bg-(--sidebar-hover) font-medium text-(--sidebar-active)"
                    : "border-transparent text-(--sidebar-foreground) hover:bg-(--sidebar-hover)"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-(--sidebar-hover) p-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-3 text-(--sidebar-foreground) hover:bg-(--sidebar-hover) hover:text-(--sidebar-foreground)"
            onClick={() => {
              handleLinkClick();
              logout();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
