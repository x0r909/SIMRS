"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMyVisits } from "@/lib/simrs-api";

function invoiceBadge(status?: string): "default" | "success" | "warning" | "danger" | "outline" {
  if (!status) return "outline";
  return status === "PAID" ? "success" : "warning";
}

export default function PortalVisitsPage() {
  const [q, setQ] = useState("");
  const visits = useQuery({
    queryKey: ["portal", "visits", q],
    queryFn: () => listMyVisits({ page: 1, limit: 20, q })
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Riwayat Kunjungan" description="Riwayat pemeriksaan dan diagnosis Anda" />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari dokter, keluhan, atau diagnosis..." />
            <Button variant="secondary" onClick={() => visits.refetch()} disabled={visits.isFetching}>
              Cari
            </Button>
          </div>

          {visits.isLoading ? <LoadingBlock label="Loading visits..." /> : null}
          {visits.isError ? <ErrorBlock message="Failed to load visit history" onRetry={() => visits.refetch()} /> : null}

          {visits.data ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Dokter</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Tagihan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.data.data.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{new Date(visit.startedAt).toLocaleString()}</TableCell>
                      <TableCell>{visit.doctor?.name ?? "-"}</TableCell>
                      <TableCell>{visit.complaint ?? "-"}</TableCell>
                      <TableCell>{visit.diagnosis ?? "-"}</TableCell>
                      <TableCell>
                        {visit.invoice ? (
                          <Badge variant={invoiceBadge(visit.invoice.status)}>{visit.invoice.status ?? "INVOICE"}</Badge>
                        ) : (
                          <Badge variant="outline">Belum ada</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visits.data.data.length === 0 ? <EmptyBlock message="Belum ada riwayat kunjungan" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
