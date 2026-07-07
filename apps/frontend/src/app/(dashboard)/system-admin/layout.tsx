/**
 * @file layout.tsx
 * @path apps/frontend/src/app/(dashboard)/system-admin/layout.tsx
 * @description Layout route /system-admin: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardShell } from "@/components/dashboard-shell";

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell prefix="/system-admin">{children}</DashboardShell>;
}
