import { DashboardShell } from "@/components/dashboard-shell";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/doctor">{children}</DashboardShell>;
}
