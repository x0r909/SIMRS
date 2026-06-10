import { DashboardShell } from "@/components/dashboard-shell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/staff">{children}</DashboardShell>;
}
