"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <ChangePasswordModal forced open={!!user.must_change_password} onClose={() => {}} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col md:ms-56">
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        {/* extra bottom padding on phones so the bottom bar never covers the last row */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
      <KeyboardShortcuts />
    </div>
  );
}
