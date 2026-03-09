"use client";

import { useIndustriesContext } from "@/lib/IndustriesContext";
import { useProfile } from "@/lib/ProfileContext";
import { DashboardLoadingScreen } from "@/components/dashboard-loading-screen";

export function DashboardDataGate({ children }: { children: React.ReactNode }) {
  const { loading: industriesLoading } = useIndustriesContext();
  const { loading: profileLoading } = useProfile();

  if (industriesLoading || profileLoading) {
    return <DashboardLoadingScreen />;
  }

  return <>{children}</>;
}
