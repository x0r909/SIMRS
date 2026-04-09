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
import { createInvoice, getApiErrorMessage, listBilling, listVisits, markInvoicePaid } from "@/lib/simrs-api";

const invoiceSchema = z.object({
  visitId: z.string().min(1, "Visit wajib dipilih"),
  itemName: z.string().optional(),
  qty: z.coerce.number().int().min(1).optional(),
  price: z.coerce.number().int().min(0).optional()
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function BillingPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const invoices = useQuery({
    queryKey: ["billing", q],
    queryFn: () => listBilling({ page: 1, limit: 100, q: q || undefined })
  });

  const visits = useQuery({
    queryKey: ["billing", "visit-options"],
    queryFn: () => listVisits({ page: 1, limit: 200 })
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { visitId: "", itemName: "", qty: 1, price: 0 }
  });

  const create = useMutation({
    mutationFn: (values: InvoiceFormValues) => {
      const withItem = values.itemName?.trim()
        ? { items: [{ name: values.itemName.trim(), qty: values.qty ?? 1, price: values.price ?? 0 }] }
        : {};
      return createInvoice({ visitId: values.visitId, ...withItem });
    },
    onSuccess: async () => {
      toast.success("Invoice created");
      form.reset({ visitId: "", itemName: "", qty: 1, price: 0 });
      await qc.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const setPaid = useMutation({
    mutationFn: markInvoicePaid,
    onSuccess: async () => {
      toast.success("Invoice marked as paid");
      await qc.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Billing" description="Invoice kunjungan pasien" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buat invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
              <FormField
                control={form.control}
                name="visitId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Visit</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="visitId">
                          <SelectValue placeholder="Select visit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(visits.data?.data ?? []).map((visit) => (
                          <SelectItem key={visit.id} value={visit.id}>
                            {visit.id} - {visit.patient?.name ?? "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial item (optional)</FormLabel>
                    <FormControl>
                      <Input id="itemName" {...field} value={field.value ?? ""} placeholder="Konsultasi" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input id="qty" type="number" {...field} />
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
              <div className="md:col-span-4">
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Create invoice"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search invoice number/patient..." />
            <Button variant="secondary" onClick={() => invoices.refetch()} disabled={invoices.isFetching}>Search</Button>
          </div>

          {invoices.isLoading ? <LoadingBlock label="Loading invoices..." /> : null}
          {invoices.isError ? <ErrorBlock message="Failed to load invoices" onRetry={() => invoices.refetch()} /> : null}

          {invoices.data ? (
            <div className="space-y-3">
              {invoices.data.data.map((invoice) => (
                <div key={invoice.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{invoice.number}</div>
                      <div className="text-xs text-muted-foreground">
                        Visit: {invoice.visit?.id ?? invoice.visitId} · {invoice.visit?.patient?.name ?? "-"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={invoice.status === "PAID" ? "success" : "warning"}>{invoice.status}</Badge>
                      <span className="font-semibold">Rp {invoice.total.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Items: {invoice.items.length}
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={invoice.status === "PAID" || setPaid.isPending}
                      onClick={() => setPaid.mutate(invoice.id)}
                    >
                      Mark paid
                    </Button>
                  </div>
                </div>
              ))}
              {invoices.data.data.length === 0 ? <EmptyBlock message="No invoices found" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
