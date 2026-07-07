"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/hospital-admin/reports/daily/page.tsx
 * @description Admin RS: laporan harian order.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { getDailyReport } from "@/lib/hospital-admin-api";
import { getApiErrorMessage } from "@/lib/simrs-api";

export default function DailyReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const reportQuery = useQuery({
    queryKey: ["hospital-daily-report", date],
    queryFn: () => getDailyReport(date)
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Laporan Harian</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan kunjungan, antrian, dan pendapatan per hari.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-[160px]"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={reportQuery.isFetching}
            onClick={() => void reportQuery.refetch()}
          >
            {reportQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {reportQuery.isLoading ? (
        <LoadingBlock label="Memuat laporan..." />
      ) : reportQuery.isError ? (
        <ErrorBlock message={getApiErrorMessage(reportQuery.error)} />
      ) : reportQuery.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Kunjungan</CardDescription>
                <CardTitle className="text-3xl">{reportQuery.data.summary.visits}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Janji Temu</CardDescription>
                <CardTitle className="text-3xl">{reportQuery.data.summary.appointments}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Antrian Selesai</CardDescription>
                <CardTitle className="text-3xl">{reportQuery.data.summary.queueCompleted}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pendapatan</CardDescription>
                <CardTitle className="text-2xl">{reportQuery.data.summary.revenueFormatted}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kunjungan per Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportQuery.data.visitsByStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada kunjungan pada tanggal ini.</p>
                ) : (
                  reportQuery.data.visitsByStatus.map((row) => (
                    <div
                      key={row.status}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{row.status}</span>
                      <Badge variant="outline">{row.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Diagnosa Terbanyak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportQuery.data.topDiagnoses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada data diagnosa untuk tanggal ini.
                  </p>
                ) : (
                  reportQuery.data.topDiagnoses.map((row, index) => (
                    <div
                      key={row.diagnosis}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate pr-2">
                        {index + 1}. {row.diagnosis}
                      </span>
                      <Badge variant="outline">{row.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Laporan{" "}
            {format(new Date(reportQuery.data.date), "dd MMMM yyyy", { locale: idLocale })} ·
            diperbarui{" "}
            {format(new Date(reportQuery.data.generatedAt), "dd MMM yyyy, HH:mm", {
              locale: idLocale
            })}
          </p>
        </>
      ) : null}
    </div>
  );
}
