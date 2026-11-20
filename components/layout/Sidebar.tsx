"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { can, type Area } from "@/lib/permissions";
import { usePinnedProjects } from "@/lib/local-lists";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  Receipt,
  Wallet,
  LogOut,
  X,
  FileText,
  Truck,
  Landmark,
  BadgeAlert,
  CalendarClock,
  TrendingUp,
  ShieldCheck,
  ScrollText,
  CalendarRange,
  ListChecks,
  Sun,
  Star,
  Waves,
  PieChart,
  Gauge,
  HeartPulse,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  /** Group is shown only to roles with this access (see lib/permissions.ts). */
  area?: Area;
  items: NavLink[];
}

const topLinks: NavLink[] = [
  { href: "/dashboard/today", label: "Today", icon: Sun },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
];

const groups: NavGroup[] = [
  {
    label: "Finance",
    area: "finance",
    items: [
      { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
      { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
      { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
      { href: "/dashboard/vendors", label: "Vendors", icon: Truck },
      { href: "/dashboard/hosting", label: "Hosting", icon: CalendarClock },
    ],
  },
  {
    label: "Reports",
    area: "finance",
    items: [
      { href: "/dashboard/finance", label: "Finance overview", icon: Wallet },
      { href: "/dashboard/finance/monthly", label: "Monthly report", icon: CalendarRange },
      { href: "/dashboard/finance/cashflow", label: "Cash-flow forecast", icon: Waves },
      { href: "/dashboard/finance/clients", label: "Client profitability", icon: PieChart },
      { href: "/dashboard/finance/budgets", label: "Project budgets", icon: Gauge },
      { href: "/dashboard/clients/health", label: "Client health", icon: HeartPulse },
      { href: "/dashboard/finance/investments", label: "Investments", icon: TrendingUp },
      { href: "/dashboard/invoices/ar-aging", label: "AR aging", icon: Landmark },
      { href: "/dashboard/invoices/ap-aging", label: "AP aging", icon: BadgeAlert },
    ],
  },
  {
    label: "Admin",
    area: "accounts",
    items: [
      { href: "/dashboard/accounts", label: "Accounts", icon: ShieldCheck },
      { href: "/dashboard/audit-log", label: "Audit log", icon: ScrollText },
    ],
  },
];

const allLinks: NavLink[] = [...topLinks, ...groups.flatMap((g) => g.items)];

function getActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const link of allLinks) {
    const matches = pathname === link.href || pathname.startsWith(`${link.href}/`);
    if (matches && (!best || link.href.length > best.length)) {
      best = link.href;
    }
  }
  return best;
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 283.46 198.43" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M201.05,74.34c-2.56,2.57-12.04,12.07-16.88,16.86-5.25,5.19-10.49,10.39-15.72,15.6-.49.49-.8.42-1.24-.01-1.16-1.16-2.36-2.28-3.51-3.43-7.15-7.15-14.29-14.3-21.42-21.46-.21-.21-.37-.38-.55-.42-.18.04-.34.22-.55.42-7.13,7.16-14.27,14.32-21.42,21.46-1.15,1.16-2.35,2.28-3.51,3.43-.44.44-.75.5-1.24.01-5.22-5.21-10.47-10.41-15.72-15.6-4.84-4.79-14.32-14.29-16.88-16.86-.18-.18-.05-.5.21-.5h16.22c.5,0,1,.17,1.35.52,0,0,0,0,0,0,5.05,5.08,10.16,10.11,15.21,15.19.48.48,1.26.48,1.74,0,7.51-7.59,15.16-15.04,22.56-22.75,1.02-1.06,1.51-1.59,2.03-1.58.51-.01,1,.51,2.03,1.58,7.4,7.71,15.05,15.16,22.56,22.75.48.48,1.26.48,1.74,0,5.05-5.08,10.15-10.12,15.21-15.19,0,0,0,0,0,0,.35-.35.85-.52,1.35-.52h16.22c.26,0,.39.31.21.5Z"
      />
      <path
        fill="var(--sidebar-active)"
        d="M164.65,110.6l-22.53,22.44c-.24.23-.62.23-.85,0l-22.08-22.11c-.24-.24-.24-.61,0-.85l22.33-22.35c.24-.24.62-.24.85,0,0,0,4.6,4.72,6.62,6.79.52.53.51,1.38-.01,1.9l-13.15,13.15c-.53.53-.53,1.39,0,1.92l5.19,5.19c.53.53,1.39.53,1.92,0l13.22-13.2c.53-.53,1.38-.53,1.91,0,2.08,2.04,6.41,6.47,6.41,6.47.24.24.42.44.18.68Z"
      />
    </svg>
  );
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const visibleGroups = groups.filter((g) => !g.area || can(user, g.area));
  const pins = usePinnedProjects(user?.id);
  const activeHref = getActiveHref(pathname);

  const handleLinkClick = () => {
    onClose?.();
  };

  const renderLink = (item: NavLink) => {
    const isActive = item.href === activeHref;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleLinkClick}
        className={`flex items-center gap-3 rounded-md border-s-2 px-3 py-2 text-sm transition-colors ${
          isActive
            ? "border-(--sidebar-active) bg-(--sidebar-hover) font-medium text-(--sidebar-active)"
            : "border-transparent text-(--sidebar-foreground) hover:bg-(--sidebar-hover)"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
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
        className={`fixed start-0 top-0 z-50 flex h-screen w-56 flex-col border-e border-(--border) bg-(--sidebar-bg) text-(--sidebar-foreground) shadow-lg transition-transform duration-200 ease-out md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-(--border) px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
            onClick={handleLinkClick}
          >
            <BrandMark className="h-5 w-5 shrink-0" />
            CodeWars PMS
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
          {topLinks.map(renderLink)}
          {pins.length > 0 && (
            <div className="pt-2">
              <p className="px-3 pb-1 pt-2 text-[0.68rem] font-semibold uppercase tracking-wider text-(--sidebar-foreground)/55">Pinned</p>
              {pins.map((p) => {
                const href = `/dashboard/projects/${p.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={p.id}
                    href={href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 rounded-md border-s-2 px-3 py-2 text-sm transition-colors ${
                      active ? "border-(--sidebar-active) bg-(--sidebar-hover) font-medium text-(--sidebar-active)" : "border-transparent text-(--sidebar-foreground) hover:bg-(--sidebar-hover)"
                    }`}
                  >
                    <Star className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{p.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {visibleGroups.map((group) => (
            <div key={group.label} className="pt-2">
              <p className="px-3 pb-1 pt-2 text-[0.68rem] font-semibold uppercase tracking-wider text-(--sidebar-foreground)/55">
                {group.label}
              </p>
              {group.items.map(renderLink)}
            </div>
          ))}
        </nav>

        <div className="border-t border-(--border) p-2">
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
