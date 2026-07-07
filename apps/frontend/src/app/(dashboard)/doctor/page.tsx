/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/doctor/page.tsx
 * @description Dashboard dokter: ringkasan jadwal dan pasien.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { DashboardOverview } from "@/components/dashboard-overview";

export default function DoctorDashboardPage() {
  return (
    <DashboardOverview
      title="Dashboard Dokter"
      description="Pasien hari ini, antrian aktif, dan jadwal praktek."
      stats={[
        { label: "Pasien Hari Ini", value: "—" },
        { label: "Antrian Aktif", value: "—" },
        { label: "Kunjungan Berikutnya", value: "—" },
        { label: "Resep Pending", value: "—" }
      ]}
    />
  );
}
