/**
 * @file layout.tsx
 * @path apps/frontend/src/app/(dashboard)/staff/layout.tsx
 * @description Layout route /staff: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardShell } from "@/components/dashboard-shell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/staff">{children}</DashboardShell>;
}
