"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, CreditCard, Pill, Stethoscope, Users } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import {
  fetchMe,
  listAppointments,
  listBilling,
  listDoctors,
  listMedicines,
  listPatients,
  queueDashboard
} from "@/lib/simrs-api";

const statCards = [
  { key: "patients", label: "Patients", icon: Users },
  { key: "doctors", label: "Doctors", icon: Stethoscope },
  { key: "appointments", label: "Appointments", icon: CalendarClock },
  { key: "queues", label: "Queues Today", icon: ClipboardList },
  { key: "medicines", label: "Medicines", icon: Pill },
  { key: "invoices", label: "Invoices", icon: CreditCard }
] as const;

export default function DashboardPage() {
  const me = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe
  });

  const [patients, doctors, appointments, queue, medicines, invoices] = useQueries({
    queries: [
      { queryKey: ["dashboard", "patients-total"], queryFn: () => listPatients({ page: 1, limit: 1 }) },
      { queryKey: ["dashboard", "doctors-total"], queryFn: () => listDoctors({ page: 1, limit: 1 }) },
      {
        queryKey: ["dashboard", "appointments-total"],
        queryFn: () => listAppointments({ page: 1, limit: 1 })
      },
      { queryKey: ["dashboard", "queue-dashboard"], queryFn: () => queueDashboard() },
      {
        queryKey: ["dashboard", "medicines-total"],
        queryFn: () => listMedicines({ page: 1, limit: 1 })
      },
      { queryKey: ["dashboard", "invoices-total"], queryFn: () => listBilling({ page: 1, limit: 1 }) }
    ]
  });

  const stats = useMemo(() => {
    return {
      patients: patients.data?.meta.total ?? 0,
      doctors: doctors.data?.meta.total ?? 0,
      appointments: appointments.data?.meta.total ?? 0,
      queues: queue.data?.length ?? 0,
      medicines: medicines.data?.meta.total ?? 0,
      invoices: invoices.data?.meta.total ?? 0
    };
  }, [appointments.data?.meta.total, doctors.data?.meta.total, invoices.data?.meta.total, medicines.data?.meta.total, patients.data?.meta.total, queue.data]);

  if (me.isLoading) {
    return (
      <div className="p-6">
        <LoadingBlock label="Loading dashboard..." />
      </div>
    );
  }

  if (me.isError || !me.data) {
    return (
      <div className="p-6">
        <ErrorBlock message="Failed to load dashboard profile." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang, <span className="font-medium">{me.data.name}</span> ({me.data.email})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;
          const value = stats[item.key];
          return (
            <Card key={item.key}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="size-4" />
                  Live from API
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Akses yang dimiliki user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(me.data.roles ?? []).map((r: string) => (
                <Badge key={r} variant="outline">{r}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue Snapshot</CardTitle>
            <CardDescription>Today waiting room</CardDescription>
          </CardHeader>
          <CardContent>
            {queue.isLoading ? <LoadingBlock label="Loading queue..." /> : null}
            {queue.isError ? <ErrorBlock message="Failed to load queue dashboard" /> : null}
            {!queue.isLoading && !queue.isError ? (
              <div className="space-y-3">
                {(queue.data ?? []).slice(0, 6).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">#{entry.number} - {entry.patient?.name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{entry.doctor?.name ?? "Any doctor"}</div>
                    </div>
                    <Badge variant={entry.status === "DONE" ? "success" : "default"}>{entry.status}</Badge>
                  </div>
                ))}
                {(queue.data ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No queue entries for today.</div> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

