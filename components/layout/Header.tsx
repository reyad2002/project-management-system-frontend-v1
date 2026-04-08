"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { LogOut, Menu, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const displayName = user?.name || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-(--border) bg-(--card)/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-md p-2 text-foreground transition-colors hover:bg-(--muted-bg) md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground">
              Project Management System
            </p>
            <p className="text-xs text-(--muted)">Dashboard workspace</p>
          </div>
        </div>

        <div
          className="relative flex items-center gap-2 md:gap-3"
          ref={profileRef}
        >
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-(--primary) text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
            aria-label="Open user menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {userInitial}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-(--border) bg-(--card) p-3 shadow-xl">
              <div className="flex items-start gap-3 border-b border-(--border) pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--primary) text-sm font-semibold text-white shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  {user?.company?.name && (
                    <p className="truncate text-xs text-(--muted)">
                      {user.company.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 md:hidden"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
