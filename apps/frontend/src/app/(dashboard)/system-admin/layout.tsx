import { DashboardShell } from "@/components/dashboard-shell";

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/system-admin">{children}</DashboardShell>;
}
