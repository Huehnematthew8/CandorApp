import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { IndustriesProvider } from "@/lib/IndustriesContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IndustriesProvider>
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

        <DashboardHeaderActions />
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
    </IndustriesProvider>
  );
}
