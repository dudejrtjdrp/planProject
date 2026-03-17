import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileGate } from "@/components/profiles/profile-gate";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProfileGate>
      <AppShell>{children}</AppShell>
    </ProfileGate>
  );
}
