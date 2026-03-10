"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Zap } from "lucide-react";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import { getInitialsFromName } from "@/lib/utils";

export function DashboardHeaderActions() {
  const router = useRouter();
  const { industries, openAddCompanyModal } = useIndustriesContext();
  const { logout } = useAuth();
  const { profile } = useProfile();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  const companies = industries.flatMap((i) => i.companies);

  const initial = getInitialsFromName(profile?.name);

  return (
    <>
      <button
        type="button"
        onClick={openAddCompanyModal}
        className="topnav-btn flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--border2)] bg-transparent px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
      >
        <Plus className="h-3 w-3 shrink-0" />
        Add Company
      </button>
      <Link
        href="/dashboard/profile"
        className="topnav-avatar ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#1a1508] transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))" }}
        title="My Story"
      >
        {initial}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="ml-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
        title="Sign out"
      >
        Sign out
      </button>
    </>
  );
}
