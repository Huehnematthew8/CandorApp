import { DashboardNav } from "@/components/dashboard-nav";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <header
        className="flex h-[52px] shrink-0 items-center gap-6 border-b border-[var(--border)] bg-[var(--bg)] px-6"
        style={{ zIndex: 10 }}
      >
        <div className="topnav-brand mr-auto flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          <span className="font-serif text-[15px] text-[var(--text)]">Candor</span>
        </div>

        <DashboardNav />

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
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
          Add Company
        </Link>
        <Link
          href="/dashboard"
          className="topnav-btn primary flex items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[#1a1508] transition-colors hover:bg-[var(--accent2)]"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          AI Generate
        </Link>
        <div
          className="topnav-avatar ml-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold text-[#1a1508]"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))" }}
        >
          JD
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
