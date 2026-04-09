"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, CreditCard } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { fetchMe, listMyAppointments, listMyBilling, listMyVisits } from "@/lib/simrs-api";

const statCards = [
  { key: "appointments", label: "Jadwal Berobat", icon: CalendarDays },
  { key: "visits", label: "Riwayat Kunjungan", icon: ClipboardList },
  { key: "unpaid", label: "Tagihan Belum Dibayar", icon: CreditCard }
] as const;

function appointmentStatusVariant(status: string): "default" | "success" | "warning" | "danger" | "outline" {
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

export default function PortalHomePage() {
  const me = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe
  });

  const [appointments, visits, billing] = useQueries({
    queries: [
      { queryKey: ["portal", "appointments"], queryFn: () => listMyAppointments({ page: 1, limit: 5 }) },
      { queryKey: ["portal", "visits"], queryFn: () => listMyVisits({ page: 1, limit: 5 }) },
      { queryKey: ["portal", "billing"], queryFn: () => listMyBilling({ page: 1, limit: 5 }) }
    ]
  });

  const stats = useMemo(() => {
    const unpaidCount = (billing.data?.data ?? []).filter((invoice) => invoice.status === "UNPAID").length;
    return {
      appointments: appointments.data?.meta.total ?? 0,
      visits: visits.data?.meta.total ?? 0,
      unpaid: unpaidCount
    };
  }, [appointments.data?.meta.total, billing.data?.data, visits.data?.meta.total]);

  if (me.isLoading || appointments.isLoading || visits.isLoading || billing.isLoading) {
    return (
      <div className="p-6">
        <LoadingBlock label="Loading patient summary..." />
      </div>
    );
  }

  if (me.isError || appointments.isError || visits.isError || billing.isError) {
    return (
      <div className="p-6">
        <ErrorBlock message="Failed to load patient summary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Ringkasan Pasien"
        description={`Selamat datang, ${me.data?.name}. Pantau jadwal berobat, kunjungan, dan tagihan Anda.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-semibold">{stats[item.key]}</div>
                  <Icon className="size-5 text-[hsl(var(--muted-foreground))]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Jadwal Terdekat</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href="/portal/appointments">Lihat semua</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(appointments.data?.data ?? []).map((appointment) => (
            <div className="rounded-md border p-4" key={appointment.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{new Date(appointment.scheduledAt).toLocaleString()}</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    Dokter: {appointment.doctor?.name ?? "-"}
                  </div>
                </div>
                <Badge variant={appointmentStatusVariant(appointment.status)}>{appointment.status}</Badge>
              </div>
            </div>
          ))}
          {(appointments.data?.data ?? []).length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">Belum ada jadwal berobat.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
