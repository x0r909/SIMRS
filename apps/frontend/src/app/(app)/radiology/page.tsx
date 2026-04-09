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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import {
  addRadiologyResult,
  createRadiologyOrder,
  getApiErrorMessage,
  listDoctors,
  listRadiologyOrders,
  listVisits,
  radiologyDailySummary,
  setRadiologyOrderStatus
} from "@/lib/simrs-api";

type RadiologyOrderStatus = "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL";

const orderStatuses: RadiologyOrderStatus[] = ["MENUNGGU", "PROSES", "SELESAI", "BATAL"];

const createOrderSchema = z.object({
  visitId: z.string().min(1, "Visit wajib dipilih"),
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  examType: z.string().min(2, "Jenis pemeriksaan wajib diisi"),
  notes: z.string().optional()
});

const addResultSchema = z.object({
  orderId: z.string().min(1, "Order wajib dipilih"),
  description: z.string().min(2, "Deskripsi wajib diisi"),
  impression: z.string().optional(),
  filePath: z.string().optional()
});

type CreateOrderValues = z.infer<typeof createOrderSchema>;
type AddResultValues = z.infer<typeof addResultSchema>;

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function statusVariant(status: RadiologyOrderStatus): "default" | "warning" | "success" | "danger" {
  if (status === "MENUNGGU" || status === "PROSES") return "warning";
  if (status === "SELESAI") return "success";
  return "danger";
}

export default function RadiologyPage() {
  const [q, setQ] = useState("");
  const [date, setDate] = useState(todayValue());
  const qc = useQueryClient();

  const orders = useQuery({
    queryKey: ["radiology", "orders", q],
    queryFn: () => listRadiologyOrders({ page: 1, limit: 100, q: q || undefined })
  });

  const summary = useQuery({
    queryKey: ["radiology", "summary", date],
    queryFn: () => radiologyDailySummary(date)
  });

  const visits = useQuery({
    queryKey: ["radiology", "visit-options"],
    queryFn: () => listVisits({ page: 1, limit: 200 })
  });

  const doctors = useQuery({
    queryKey: ["radiology", "doctor-options"],
    queryFn: () => listDoctors({ page: 1, limit: 200 })
  });

  const createOrderForm = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { visitId: "", doctorId: "", examType: "", notes: "" }
  });

  const addResultForm = useForm<AddResultValues>({
    resolver: zodResolver(addResultSchema),
    defaultValues: { orderId: "", description: "", impression: "", filePath: "" }
  });

  const createOrder = useMutation({
    mutationFn: createRadiologyOrder,
    onSuccess: async () => {
      toast.success("Order radiologi berhasil dibuat");
      createOrderForm.reset({ visitId: "", doctorId: "", examType: "", notes: "" });
      await qc.invalidateQueries({ queryKey: ["radiology"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RadiologyOrderStatus }) =>
      setRadiologyOrderStatus(id, status),
    onSuccess: async () => {
      toast.success("Status order radiologi diperbarui");
      await qc.invalidateQueries({ queryKey: ["radiology"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const addResult = useMutation({
    mutationFn: (values: AddResultValues) =>
      addRadiologyResult(values.orderId, {
        description: values.description,
        impression: values.impression,
        filePath: values.filePath
      }),
    onSuccess: async () => {
      toast.success("Hasil radiologi berhasil ditambahkan");
      addResultForm.reset({ orderId: "", description: "", impression: "", filePath: "" });
      await qc.invalidateQueries({ queryKey: ["radiology"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Radiology" description="Kelola order dan hasil radiologi" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buat order radiologi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...createOrderForm}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createOrderForm.handleSubmit((values) => createOrder.mutate(values))}>
              <FormField
                control={createOrderForm.control}
                name="visitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="rad-visit">
                          <SelectValue placeholder="Pilih visit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(visits.data?.data ?? []).map((visit) => (
                          <SelectItem key={visit.id} value={visit.id}>
                            {visit.id.slice(0, 8)} - {visit.patient?.name ?? "Unknown patient"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOrderForm.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dokter</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="rad-doctor">
                          <SelectValue placeholder="Pilih dokter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(doctors.data?.data ?? []).map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOrderForm.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis pemeriksaan</FormLabel>
                    <FormControl>
                      <Input id="rad-exam-type" placeholder="Foto Thorax PA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOrderForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Input id="rad-notes" placeholder="Catatan klinis" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <Button type="submit" disabled={createOrder.isPending}>
                  {createOrder.isPending ? "Menyimpan..." : "Buat order"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan harian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="rad-summary-date">Tanggal</Label>
              <Input id="rad-summary-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <Button variant="secondary" onClick={() => summary.refetch()} disabled={summary.isFetching}>
              Refresh summary
            </Button>
          </div>

          {summary.isLoading ? <LoadingBlock label="Memuat ringkasan radiologi..." /> : null}
          {summary.isError ? <ErrorBlock message="Gagal memuat ringkasan radiologi" onRetry={() => summary.refetch()} /> : null}

          {summary.data ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryCard label="Menunggu" value={summary.data.counts.menunggu} />
              <SummaryCard label="Proses" value={summary.data.counts.proses} />
              <SummaryCard label="Selesai" value={summary.data.counts.selesai} />
              <SummaryCard label="Total" value={summary.data.counts.total} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Input hasil radiologi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...addResultForm}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={addResultForm.handleSubmit((values) => addResult.mutate(values))}>
              <FormField
                control={addResultForm.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Order</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="rad-order">
                          <SelectValue placeholder="Pilih order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(orders.data?.data ?? []).map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.examType} - {order.visit?.patient?.name ?? "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addResultForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input id="rad-description" placeholder="Tampak infiltrat di paru kanan bawah" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addResultForm.control}
                name="impression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesan</FormLabel>
                    <FormControl>
                      <Input id="rad-impression" placeholder="Pneumonia lobus kanan bawah" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addResultForm.control}
                name="filePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path file</FormLabel>
                    <FormControl>
                      <Input id="rad-file-path" placeholder="/storage/radiologi/hasil.jpg" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <Button type="submit" disabled={addResult.isPending}>
                  {addResult.isPending ? "Menyimpan..." : "Tambah hasil"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar order radiologi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Cari pasien, dokter, status, atau jenis pemeriksaan..."
            />
            <Button variant="secondary" onClick={() => orders.refetch()} disabled={orders.isFetching}>
              Search
            </Button>
          </div>

          {orders.isLoading ? <LoadingBlock label="Memuat order radiologi..." /> : null}
          {orders.isError ? <ErrorBlock message="Gagal memuat order radiologi" onRetry={() => orders.refetch()} /> : null}

          {orders.data ? (
            <div className="space-y-3">
              {orders.data.data.map((order) => (
                <div key={order.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{order.examType}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.visit?.patient?.name ?? "Unknown patient"} · {order.doctor?.name ?? "Unknown doctor"}
                      </div>
                      <div className="text-xs text-muted-foreground">Hasil: {order.results?.length ?? 0}</div>
                    </div>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {orderStatuses.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === order.status ? "default" : "outline"}
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: order.id, status })}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              {orders.data.data.length === 0 ? <EmptyBlock message="Belum ada order radiologi" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
