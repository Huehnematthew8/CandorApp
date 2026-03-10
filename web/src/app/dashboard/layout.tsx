import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard";
import { DashboardDataGate } from "@/components/dashboard-data-gate";
import { CommandPalette } from "@/components/command-palette";
import { IndustriesProvider } from "@/lib/IndustriesContext";
import { ProfileProvider } from "@/lib/ProfileContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <IndustriesProvider>
        <ProfileProvider>
          <DashboardDataGate>
            <CommandPalette />
            <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
              <header
                className="flex h-14 shrink-0 items-center gap-8 border-b border-[var(--border)] bg-[var(--surface)]/80 px-6 backdrop-blur-sm"
                style={{ zIndex: 10 }}
              >
                <div className="topnav-brand mr-auto flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="font-serif text-[15px] font-normal tracking-tight text-[var(--text)]">Candor</span>
                </div>

                <DashboardNav />

                <DashboardHeaderActions />
              </header>
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          </DashboardDataGate>
        </ProfileProvider>
      </IndustriesProvider>
    </DashboardAuthGuard>
  );
}
