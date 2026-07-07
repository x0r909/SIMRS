/**
 * @file layout.tsx
 * @path apps/frontend/src/app/(dashboard)/doctor/layout.tsx
 * @description Layout route /doctor: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardShell } from "@/components/dashboard-shell";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/doctor">{children}</DashboardShell>;
}
