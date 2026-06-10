import { DashboardShell } from "@/components/dashboard-shell";

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/hospital-admin">{children}</DashboardShell>;
}
