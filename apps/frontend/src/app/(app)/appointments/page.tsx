"use client";

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
import {
  createAppointment,
  getApiErrorMessage,
  listAppointments,
  listDoctors,
  listPatients,
  setAppointmentStatus
} from "@/lib/simrs-api";
import type { AppointmentStatus } from "@/lib/types";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient wajib dipilih"),
  doctorId: z.string().min(1, "Doctor wajib dipilih"),
  scheduledAt: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional()
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const statuses: AppointmentStatus[] = ["SCHEDULED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AppointmentsPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const appointments = useQuery({
    queryKey: ["appointments", q],
    queryFn: () => listAppointments({ page: 1, limit: 50, q: q || undefined })
  });
  const patients = useQuery({
    queryKey: ["appointments", "patients-options"],
    queryFn: () => listPatients({ page: 1, limit: 200 })
  });
  const doctors = useQuery({
    queryKey: ["appointments", "doctors-options"],
    queryFn: () => listDoctors({ page: 1, limit: 200 })
  });

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patientId: "", doctorId: "", scheduledAt: "", notes: "" }
  });

  const create = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      toast.success("Appointment created");
      form.reset();
      await qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => setAppointmentStatus(id, status),
    onSuccess: async () => {
      toast.success("Appointment status updated");
      await qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Appointments" description="Jadwal konsultasi pasien" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buat appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="patient">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(patients.data?.data ?? []).map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>{patient.mrn} - {patient.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="doctor">
                          <SelectValue placeholder="Select doctor" />
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
                    <FormLabel>Schedule</FormLabel>
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
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input id="notes" {...field} value={field.value ?? ""} placeholder="Optional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Save appointment"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search patient or doctor..." />
            <Button variant="secondary" onClick={() => appointments.refetch()} disabled={appointments.isFetching}>Search</Button>
          </div>

          {appointments.isLoading ? <LoadingBlock label="Loading appointments..." /> : null}
          {appointments.isError ? <ErrorBlock message="Failed to load appointments" onRetry={() => appointments.refetch()} /> : null}

          {appointments.data ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.data.data.map((appointment) => (
                    <TableRow key={appointment.id} className="align-top">
                      <TableCell>{new Date(appointment.scheduledAt).toLocaleString()}</TableCell>
                      <TableCell>{appointment.patient?.name ?? "-"}</TableCell>
                      <TableCell>{appointment.doctor?.name ?? "-"}</TableCell>
                      <TableCell><Badge variant="outline">{appointment.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {statuses.map((status) => (
                            <Button
                              key={status}
                              variant={status === appointment.status ? "default" : "outline"}
                              size="sm"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: appointment.id, status })}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {appointments.data.data.length === 0 ? <EmptyBlock message="No appointments found" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
