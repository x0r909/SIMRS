"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/system-admin/page.tsx
 * @description Dashboard Admin Sistem: ringkasan platform.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { DashboardOverview } from "@/components/dashboard-overview";
import { ErrorBlock } from "@/components/ui/state-block";
import { getApiErrorMessage } from "@/lib/simrs-api";
import { getSystemAdminOverview } from "@/lib/system-overview-api";

export default function SystemAdminPage() {
  const overview = useQuery({
    queryKey: ["system-admin-overview"],
    queryFn: getSystemAdminOverview,
    refetchInterval: 30_000
  });

  if (overview.isError) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Sistem</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring, keamanan, dan operasional platform SIMRS.
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
      title="Admin Sistem"
      description="Monitoring, keamanan, dan operasional platform SIMRS."
      stats={overview.data?.stats ?? []}
      isLoading={overview.isLoading}
      footer={
        generatedAt ? `Data diperbarui: ${generatedAt} · auto-refresh 30 detik` : undefined
      }
    />
  );
}
