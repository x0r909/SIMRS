/**
 * @file layout.tsx
 * @path apps/frontend/src/app/(dashboard)/patient/layout.tsx
 * @description Layout route /patient: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardShell } from "@/components/dashboard-shell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/patient">{children}</DashboardShell>;
}
