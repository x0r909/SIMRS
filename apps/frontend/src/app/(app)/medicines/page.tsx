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
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createMedicine, deleteMedicine, getApiErrorMessage, listMedicines } from "@/lib/simrs-api";

const medicineSchema = z.object({
  sku: z.string().min(2, "SKU wajib diisi"),
  name: z.string().min(2, "Nama wajib diisi"),
  unit: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  price: z.coerce.number().int().min(0)
});

type MedicineFormValues = z.infer<typeof medicineSchema>;

export default function MedicinesPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const medicines = useQuery({
    queryKey: ["medicines", q],
    queryFn: () => listMedicines({ page: 1, limit: 100, q: q || undefined })
  });

  const form = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: { sku: "", name: "", unit: "tablet", stock: 0, price: 0 }
  });

  const create = useMutation({
    mutationFn: createMedicine,
    onSuccess: async () => {
      toast.success("Medicine added");
      form.reset({ sku: "", name: "", unit: "tablet", stock: 0, price: 0 });
      await qc.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const remove = useMutation({
    mutationFn: deleteMedicine,
    onSuccess: async () => {
      toast.success("Medicine deleted");
      await qc.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Medicines / Pharmacy" description="Stok dan harga obat" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah obat</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-5" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input id="sku" {...field} placeholder="MED003" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="name" {...field} placeholder="Nama obat" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input id="unit" {...field} value={field.value ?? ""} placeholder="tablet" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input id="stock" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input id="price" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-5">
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Save medicine"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search medicines..." />
            <Button variant="secondary" onClick={() => medicines.refetch()} disabled={medicines.isFetching}>Search</Button>
          </div>

          {medicines.isLoading ? <LoadingBlock label="Loading medicines..." /> : null}
          {medicines.isError ? <ErrorBlock message="Failed to load medicines" onRetry={() => medicines.refetch()} /> : null}

          {medicines.data ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.data.data.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-mono text-xs">{medicine.sku}</TableCell>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.unit}</TableCell>
                      <TableCell><Badge variant={medicine.stock > 0 ? "success" : "danger"}>{medicine.stock}</Badge></TableCell>
                      <TableCell>Rp {medicine.price.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(medicine.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {medicines.data.data.length === 0 ? <EmptyBlock message="No medicines found" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
