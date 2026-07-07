"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/portal/lab-results/page.tsx
 * @description Halaman route /portal/lab-results.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMyLaboratoryOrders } from "@/lib/simrs-api";

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "IN_PROGRESS":
      return "warning";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Menunggu";
    case "IN_PROGRESS":
      return "Diproses";
    case "COMPLETED":
      return "Selesai";
    case "CANCELLED":
      return "Dibatalkan";
    default:
      return status;
  }
}

export default function PortalLabResultsPage() {
  const [q, setQ] = useState("");
  const orders = useQuery({
    queryKey: ["portal", "lab-results", q],
    queryFn: () => listMyLaboratoryOrders({ page: 1, limit: 20, q })
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Hasil Laboratorium"
        description="Pantau permintaan dan hasil pemeriksaan lab Anda"
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Cari jenis pemeriksaan atau dokter..."
            />
            <Button variant="secondary" onClick={() => orders.refetch()} disabled={orders.isFetching}>
              Cari
            </Button>
          </div>

          {orders.isLoading ? <LoadingBlock label="Memuat hasil lab..." /> : null}
          {orders.isError ? (
            <ErrorBlock message="Gagal memuat hasil lab" onRetry={() => orders.refetch()} />
          ) : null}

          {orders.data ? (
            <div className="space-y-4">
              {orders.data.data.map((order) => (
                <div className="rounded-md border p-4" key={order.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{order.testType}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(order.orderedAt).toLocaleString()} · Dr. {order.doctor?.name ?? "-"}
                      </div>
                    </div>
                    <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                  </div>

                  {(order.results ?? []).length > 0 ? (
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Nilai</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Normal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(order.results ?? []).map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>{result.parameter ?? "-"}</TableCell>
                            <TableCell>{result.value ?? "-"}</TableCell>
                            <TableCell>{result.unit ?? "-"}</TableCell>
                            <TableCell>{result.normalRange ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                      Hasil belum tersedia.
                    </p>
                  )}
                </div>
              ))}
              {orders.data.data.length === 0 ? (
                <EmptyBlock message="Belum ada pemeriksaan laboratorium" />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
