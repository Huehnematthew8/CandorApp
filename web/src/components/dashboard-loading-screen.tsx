"use client";

export function DashboardLoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--bg)]">
      <div className="flex gap-1.5">
        <span
          className="h-2 w-2 rounded-full bg-[var(--accent)] opacity-80"
          style={{ animation: "dashboard-loading-bounce 0.6s ease-in-out infinite" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[var(--accent)] opacity-80"
          style={{ animation: "dashboard-loading-bounce 0.6s ease-in-out 0.2s infinite" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[var(--accent)] opacity-80"
          style={{ animation: "dashboard-loading-bounce 0.6s ease-in-out 0.4s infinite" }}
        />
      </div>
      <p className="text-sm text-[var(--text-muted)]">Loading your dashboard…</p>
    </div>
  );
}
