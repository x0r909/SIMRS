"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { getPublicSystemSettings } from "@/lib/system-settings-api";

const SCOPE_LABELS: Record<string, string> = {
  registration: "Registrasi ditutup",
  patients: "Portal pasien ditutup",
  full: "Hanya System Admin yang dapat mengakses"
};

export function MaintenanceBanner({ roles }: { roles: string[] }) {
  const isSystemAdmin = roles.includes("SYSTEM_ADMIN") || roles.includes("admin");

  const { data } = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: getPublicSystemSettings,
    refetchInterval: 30_000,
    enabled: isSystemAdmin
  });

  if (!isSystemAdmin || !data?.maintenanceMode) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Mode maintenance aktif</span>
        <span className="text-amber-800">
          — {SCOPE_LABELS[data.maintenanceScope] ?? data.maintenanceScope}
        </span>
        {data.maintenanceMessage && (
          <span className="text-amber-700">· {data.maintenanceMessage}</span>
        )}
        <Link href="/system-admin/settings" className="ml-auto underline underline-offset-2">
          Kelola pengaturan
        </Link>
      </div>
    </div>
  );
}
