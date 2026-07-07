"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/portal/appointments/page.tsx
 * @description Halaman route /portal/appointments.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createMyAppointment, getApiErrorMessage, listDoctors, listMyAppointments } from "@/lib/simrs-api";

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

const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  scheduledAt: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional()
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function PortalAppointmentsPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const appointments = useQuery({
    queryKey: ["portal", "appointments", q],
    queryFn: () => listMyAppointments({ page: 1, limit: 20, q })
  });

  const doctors = useQuery({
    queryKey: ["portal", "appointments", "doctors-options"],
    queryFn: () => listDoctors({ page: 1, limit: 100 })
  });

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { doctorId: "", scheduledAt: "", notes: "" }
  });

  const create = useMutation({
    mutationFn: (values: AppointmentFormValues) => createMyAppointment(values),
    onSuccess: async () => {
      toast.success("Jadwal berhasil dibuat");
      form.reset();
      await qc.invalidateQueries({ queryKey: ["portal", "appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Jadwal Berobat" description="Daftar jadwal konsultasi Anda" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buat Jadwal Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dokter</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="doctor">
                          <SelectValue placeholder="Pilih dokter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(doctors.data?.data ?? []).map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>{doctor.code} - {doctor.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jadwal</FormLabel>
                    <FormControl>
                      <Input id="scheduledAt" type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Input id="notes" {...field} value={field.value ?? ""} placeholder="Catatan tambahan (opsional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Menyimpan..." : "Buat Jadwal"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

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
          {doctors.isError ? <ErrorBlock message="Tidak bisa memuat daftar dokter" onRetry={() => doctors.refetch()} /> : null}

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
