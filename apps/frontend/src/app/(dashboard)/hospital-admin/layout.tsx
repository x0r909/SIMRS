/**
 * @file layout.tsx
 * @path apps/frontend/src/app/(dashboard)/hospital-admin/layout.tsx
 * @description Layout route /hospital-admin: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardShell } from "@/components/dashboard-shell";

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/hospital-admin">{children}</DashboardShell>;
}
