"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingBlock } from "@/components/ui/state-block";
import { getPublicSystemSettings } from "@/lib/system-settings-api";

const SCOPE_LABELS: Record<string, string> = {
  registration: "Registrasi ditutup",
  patients: "Portal pasien ditutup",
  full: "Sistem tidak tersedia"
};

export default function MaintenancePage() {
  const searchParams = useSearchParams();
  const urlMessage = searchParams.get("msg");

  const { data, isLoading } = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: getPublicSystemSettings,
    refetchInterval: 30_000
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <LoadingBlock label="Memuat status sistem..." />
      </div>
    );
  }

  const active = data?.maintenanceMode ?? false;
  const message =
    urlMessage ||
    data?.maintenanceMessage ||
    "Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle>{active ? "Mode Maintenance" : "Sistem Beroperasi"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm">
          <p className="text-muted-foreground">{active ? message : "Maintenance tidak aktif."}</p>

          {active && data?.maintenanceScope && (
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-xs">
              Cakupan: <strong>{SCOPE_LABELS[data.maintenanceScope] ?? data.maintenanceScope}</strong>
            </p>
          )}

          {active && data?.maintenanceEndsAt && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              Estimasi selesai:{" "}
              {format(new Date(data.maintenanceEndsAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
            </p>
          )}

          {data?.hospitalName && (
            <p className="text-xs text-muted-foreground">{data.hospitalName}</p>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Beranda
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Login Staff (System Admin)</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
