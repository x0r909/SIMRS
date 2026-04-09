"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDoctor, deleteDoctor, getApiErrorMessage, listDoctors } from "@/lib/simrs-api";

const doctorSchema = z.object({
  code: z.string().min(2, "Code is required"),
  name: z.string().min(2, "Name is required"),
  specialty: z.string().optional(),
  phone: z.string().optional()
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

export default function DoctorsPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const doctors = useQuery({
    queryKey: ["doctors", q],
    queryFn: () => listDoctors({ page: 1, limit: 50, q: q || undefined })
  });

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { code: "", name: "", specialty: "", phone: "" }
  });

  const create = useMutation({
    mutationFn: createDoctor,
    onSuccess: async () => {
      toast.success("Doctor created");
      form.reset();
      await qc.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const remove = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: async () => {
      toast.success("Doctor deleted");
      await qc.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Doctors" description="Master data daftar dokter" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah dokter</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input id="code" {...field} placeholder="DR003" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="name" {...field} placeholder="Dr. Nama" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input id="specialty" {...field} value={field.value ?? ""} placeholder="Spesialis" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input id="phone" {...field} value={field.value ?? ""} placeholder="08xxxxxxxxxx" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Save doctor"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search doctor..." />
            <Button variant="secondary" onClick={() => doctors.refetch()} disabled={doctors.isFetching}>Search</Button>
          </div>

          {doctors.isLoading ? <LoadingBlock label="Loading doctors..." /> : null}
          {doctors.isError ? <ErrorBlock message="Failed to load doctors" onRetry={() => doctors.refetch()} /> : null}

          {doctors.data ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.data.data.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-mono text-xs">{doctor.code}</TableCell>
                      <TableCell className="font-medium">{doctor.name}</TableCell>
                      <TableCell>{doctor.specialty || "-"}</TableCell>
                      <TableCell>{doctor.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => remove.mutate(doctor.id)} disabled={remove.isPending}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {doctors.data.data.length === 0 ? <EmptyBlock message="No doctors found" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
