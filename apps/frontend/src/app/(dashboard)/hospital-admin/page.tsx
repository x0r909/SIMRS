"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { DashboardOverview } from "@/components/dashboard-overview";
import { ErrorBlock } from "@/components/ui/state-block";
import { getHospitalOverview } from "@/lib/hospital-admin-api";
import { getApiErrorMessage } from "@/lib/simrs-api";

export default function HospitalAdminPage() {
  const overview = useQuery({
    queryKey: ["hospital-admin-overview"],
    queryFn: getHospitalOverview,
    refetchInterval: 30_000
  });

  if (overview.isError) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Rumah Sakit</h1>
          <p className="text-sm text-muted-foreground">
            Operasional harian dan manajemen unit rumah sakit.
          </p>
        </div>
        <ErrorBlock message={getApiErrorMessage(overview.error)} />
      </div>
    );
  }

  const generatedAt = overview.data?.generatedAt
    ? format(new Date(overview.data.generatedAt), "dd MMM yyyy, HH:mm:ss", { locale: idLocale })
    : undefined;

  return (
    <DashboardOverview
      title="Admin Rumah Sakit"
      description={
        overview.data?.hospitalName
          ? `${overview.data.hospitalName} — operasional harian dan manajemen unit.`
          : "Operasional harian dan manajemen unit rumah sakit."
      }
      stats={overview.data?.stats ?? []}
      isLoading={overview.isLoading}
      footer={
        generatedAt ? `Data diperbarui: ${generatedAt} · auto-refresh 30 detik` : undefined
      }
    />
  );
}
