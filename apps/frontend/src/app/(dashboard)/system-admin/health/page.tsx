"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/system-admin/health/page.tsx
 * @description Admin Sistem: status layanan infrastruktur.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Activity,
  CheckCircle2,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  XCircle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { getApiErrorMessage } from "@/lib/simrs-api";
import {
  getDetailedHealth,
  isServiceUp,
  mergeHealthIndicators,
  type HealthIndicatorStatus
} from "@/lib/health-api";
import { cn } from "@/lib/utils";

const SERVICE_META: Record<
  string,
  { label: string; description: string; icon: typeof Database }
> = {
  database: {
    label: "Database",
    description: "PostgreSQL — koneksi Prisma & query dasar",
    icon: Database
  },
  redis: {
    label: "Redis",
    description: "Cache, session, dan antrian background",
    icon: Server
  },
  minio: {
    label: "MinIO",
    description: "Penyimpanan objek (backup, berkas, dokumen)",
    icon: HardDrive
  }
};

function formatCheckedAt(date: Date): string {
  return format(date, "dd MMM yyyy, HH:mm:ss", { locale: idLocale });
}

function ServiceCard({
  serviceKey,
  status
}: {
  serviceKey: string;
  status: HealthIndicatorStatus | undefined;
}) {
  const meta = SERVICE_META[serviceKey] ?? {
    label: serviceKey,
    description: "Layanan infrastruktur",
    icon: Activity
  };
  const Icon = meta.icon;
  const up = isServiceUp(status);
  const errorDetail =
    status?.error && typeof status.error === "object"
      ? JSON.stringify(status.error)
      : typeof status?.error === "string"
        ? status.error
        : null;

  return (
    <Card className={cn(!up && "border-red-200 bg-red-50/40")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{meta.label}</CardTitle>
              <CardDescription className="mt-0.5">{meta.description}</CardDescription>
            </div>
          </div>
          <Badge variant={up ? "success" : "danger"}>{up ? "Online" : "Offline"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {up ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={up ? "text-emerald-700" : "text-red-700"}>
            {up ? "Respons normal" : "Tidak dapat dijangkau"}
          </span>
        </div>
        {errorDetail && (
          <p className="rounded-md border border-red-200 bg-white/80 p-2 text-xs text-red-800">
            {errorDetail}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SystemHealthPage() {
  const health = useQuery({
    queryKey: ["health-detailed"],
    queryFn: getDetailedHealth,
    refetchInterval: 30_000
  });

  if (health.isLoading) {
    return <LoadingBlock label="Memuat status layanan..." />;
  }

  if (health.isError || !health.data) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Health Check</h1>
          <p className="text-sm text-muted-foreground">
            Status koneksi layanan infrastruktur SIMRS.
          </p>
        </div>
        <ErrorBlock message={getApiErrorMessage(health.error)} />
      </div>
    );
  }

  const services = mergeHealthIndicators(health.data);
  const serviceKeys = Object.keys(SERVICE_META).filter((key) => key in services);
  const allKeys = serviceKeys.length > 0 ? serviceKeys : Object.keys(services);
  const upCount = allKeys.filter((key) => isServiceUp(services[key])).length;
  const allUp = allKeys.length > 0 && upCount === allKeys.length;
  const anyDown = upCount < allKeys.length;
  const checkedAt = health.dataUpdatedAt ? new Date(health.dataUpdatedAt) : new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Health Check</h1>
          <p className="text-sm text-muted-foreground">
            Status koneksi Database, Redis, dan MinIO. Auto-refresh setiap 30 detik.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={health.isFetching}
          onClick={() => void health.refetch()}
        >
          {health.isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Perbarui
        </Button>
      </div>

      <Card
        className={cn(
          allUp && "border-emerald-200 bg-emerald-50/50",
          anyDown && "border-red-200 bg-red-50/50"
        )}
      >
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                allUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}
            >
              {allUp ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <p className="font-semibold">
                {allUp ? "Semua layanan beroperasi normal" : "Ada layanan yang bermasalah"}
              </p>
              <p className="text-sm text-muted-foreground">
                {upCount} dari {allKeys.length} layanan online
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Terakhir diperiksa</p>
            <p className="font-medium text-foreground">{formatCheckedAt(checkedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {allKeys.map((key) => (
          <ServiceCard key={key} serviceKey={key} status={services[key]} />
        ))}
      </div>

      {health.data.status && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Status keseluruhan API:</span>
          <Badge variant={health.data.status === "ok" ? "success" : "danger"}>
            {health.data.status === "ok" ? "OK" : "ERROR"}
          </Badge>
        </div>
      )}
    </div>
  );
}
