"use client";

import Link from "next/link";
import { Plus, Zap } from "lucide-react";

export function DashboardHeaderActions() {
  return (
    <>
      <div className="topnav-stats flex items-center gap-5">
        <div className="stat-chip flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <div className="stat-dot h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
          <span><strong className="font-medium text-[var(--text)]">4</strong> Applied</span>
        </div>
        <div className="stat-chip flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <div className="stat-dot h-1.5 w-1.5 rounded-full bg-[var(--purple)]" />
          <span><strong className="font-medium text-[var(--text)]">2</strong> Interviews</span>
        </div>
        <div className="stat-chip flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <div className="stat-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          <span><strong className="font-medium text-[var(--text)]">1</strong> Offer</span>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="topnav-btn flex items-center gap-1.5 rounded-full border border-[var(--border2)] bg-transparent px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
      >
        <Plus className="h-3 w-3 shrink-0" />
        Add Company
      </Link>
      <Link
        href="/dashboard"
        className="topnav-btn primary flex items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[#1a1508] transition-colors hover:bg-[var(--accent2)]"
      >
        <Zap className="h-3 w-3 shrink-0" />
        AI Generate
      </Link>
      <div
        className="topnav-avatar ml-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold text-[#1a1508]"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))" }}
      >
        JD
      </div>
    </>
  );
}
