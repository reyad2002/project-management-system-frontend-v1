"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePortalAuth } from "@/lib/portal-auth-context";

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 283.46 198.43" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="var(--primary)"
        d="M201.05,74.34c-2.56,2.57-12.04,12.07-16.88,16.86-5.25,5.19-10.49,10.39-15.72,15.6-.49.49-.8.42-1.24-.01-1.16-1.16-2.36-2.28-3.51-3.43-7.15-7.15-14.29-14.3-21.42-21.46-.21-.21-.37-.38-.55-.42-.18.04-.34.22-.55.42-7.13,7.16-14.27,14.32-21.42,21.46-1.15,1.16-2.35,2.28-3.51,3.43-.44.44-.75.5-1.24.01-5.22-5.21-10.47-10.41-15.72-15.6-4.84-4.79-14.32-14.29-16.88-16.86-.18-.18-.05-.5.21-.5h16.22c.5,0,1,.17,1.35.52,0,0,0,0,0,0,5.05,5.08,10.16,10.11,15.21,15.19.48.48,1.26.48,1.74,0,7.51-7.59,15.16-15.04,22.56-22.75,1.02-1.06,1.51-1.59,2.03-1.58.51-.01,1,.51,2.03,1.58,7.4,7.71,15.05,15.16,22.56,22.75.48.48,1.26.48,1.74,0,5.05-5.08,10.15-10.12,15.21-15.19,0,0,0,0,0,0,.35-.35.85-.52,1.35-.52h16.22c.26,0,.39.31.21.5Z"
      />
      <path
        fill="var(--accent)"
        d="M164.65,110.6l-22.53,22.44c-.24.23-.62.23-.85,0l-22.08-22.11c-.24-.24-.24-.61,0-.85l22.33-22.35c.24-.24.62-.24.85,0,0,0,4.6,4.72,6.62,6.79.52.53.51,1.38-.01,1.9l-13.15,13.15c-.53.53-.53,1.39,0,1.92l5.19,5.19c.53.53,1.39.53,1.92,0l13.22-13.2c.53-.53,1.38-.53,1.91,0,2.08,2.04,6.41,6.47,6.41,6.47.24.24.42.44.18.68Z"
      />
    </svg>
  );
}

export function PortalHeader() {
  const { portalUser, logout } = usePortalAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-(--border) bg-(--card)/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/portal" className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <span
            className="text-sm font-bold text-(--foreground)"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            CodeWars PMS
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {portalUser && (
            <span className="hidden text-sm text-(--muted) sm:inline">
              Hello, {portalUser.name} · {portalUser.client_name}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
