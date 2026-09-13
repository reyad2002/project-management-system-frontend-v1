"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalAuthProvider, usePortalAuth } from "@/lib/portal-auth-context";
import { PortalHeader } from "@/components/portal/PortalHeader";

const PUBLIC_PATHS = ["/portal/login", "/portal/accept-invite"];

function PortalGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { portalUser, loading } = usePortalAuth();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading || isPublic) return;
    if (!portalUser) router.replace("/portal/login");
  }, [loading, isPublic, portalUser, router]);

  if (isPublic) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!portalUser) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PortalHeader />
      <main className="mx-auto max-w-5xl p-4 md:p-6">{children}</main>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthProvider>
      <PortalGate>{children}</PortalGate>
    </PortalAuthProvider>
  );
}
