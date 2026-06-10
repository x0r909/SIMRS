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
