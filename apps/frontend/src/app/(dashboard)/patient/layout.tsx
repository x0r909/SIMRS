import { DashboardShell } from "@/components/dashboard-shell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/patient">{children}</DashboardShell>;
}
