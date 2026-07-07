/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/staff/page.tsx
 * @description Dashboard staff operasional (perawat, kasir, dll.).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardOverview } from "@/components/dashboard-overview";

export default function StaffDashboardPage() {
  return (
    <DashboardOverview
      title="Dashboard Staff"
      description="Modul operasional sesuai peran staff Anda."
      stats={[
        { label: "Tugas Hari Ini", value: "—" },
        { label: "Antrian", value: "—" },
        { label: "Pending", value: "—" },
        { label: "Selesai", value: "—" }
      ]}
    />
  );
}
