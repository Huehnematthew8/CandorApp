"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && pathname?.startsWith("/dashboard")) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <span className="text-sm text-[var(--text-muted)]">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated && pathname?.startsWith("/dashboard")) {
    return null;
  }

  return <>{children}</>;
}
