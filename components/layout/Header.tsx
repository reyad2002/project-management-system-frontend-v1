"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { LogOut, Menu, User } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-[var(--foreground)] hover:bg-[var(--muted)] md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex flex-1 items-center justify-end gap-4 md:flex-initial">
        <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <User className="h-4 w-4" />
          {user?.name} {user?.company?.name && `(${user.company.name})`}
        </span>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
