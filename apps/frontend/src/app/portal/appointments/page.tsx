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
import { listMyAppointments } from "@/lib/simrs-api";

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

export default function PortalAppointmentsPage() {
  const [q, setQ] = useState("");
  const appointments = useQuery({
    queryKey: ["portal", "appointments", q],
    queryFn: () => listMyAppointments({ page: 1, limit: 20, q })
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Jadwal Berobat" description="Daftar jadwal konsultasi Anda" />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari dokter atau catatan..." />
            <Button variant="secondary" onClick={() => appointments.refetch()} disabled={appointments.isFetching}>
              Cari
            </Button>
          </div>

          {appointments.isLoading ? <LoadingBlock label="Loading appointments..." /> : null}
          {appointments.isError ? <ErrorBlock message="Failed to load appointments" onRetry={() => appointments.refetch()} /> : null}

          {appointments.data ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Dokter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.data.data.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{new Date(appointment.scheduledAt).toLocaleString()}</TableCell>
                      <TableCell>{appointment.doctor?.name ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(appointment.status)}>{appointment.status}</Badge>
                      </TableCell>
                      <TableCell>{appointment.notes ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {appointments.data.data.length === 0 ? <EmptyBlock message="Belum ada jadwal berobat" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
