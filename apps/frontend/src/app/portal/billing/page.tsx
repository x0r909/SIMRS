"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { listMyBilling } from "@/lib/simrs-api";

function billingVariant(status: string): "default" | "success" | "warning" | "danger" | "outline" {
  return status === "PAID" ? "success" : "warning";
}

export default function PortalBillingPage() {
  const [q, setQ] = useState("");
  const billing = useQuery({
    queryKey: ["portal", "billing", q],
    queryFn: () => listMyBilling({ page: 1, limit: 20, q })
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Tagihan Pribadi" description="Pantau status pembayaran dan rincian invoice Anda" />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari nomor invoice atau nama dokter..." />
            <Button variant="secondary" onClick={() => billing.refetch()} disabled={billing.isFetching}>
              Cari
            </Button>
          </div>

          {billing.isLoading ? <LoadingBlock label="Loading invoices..." /> : null}
          {billing.isError ? <ErrorBlock message="Failed to load billing data" onRetry={() => billing.refetch()} /> : null}

          {billing.data ? (
            <div className="space-y-3">
              {billing.data.data.map((invoice) => (
                <div className="rounded-md border p-4" key={invoice.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{invoice.number}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(invoice.createdAt).toLocaleString()} · Dr. {invoice.visit?.doctor?.name ?? "-"}
                      </div>
                    </div>
                    <Badge variant={billingVariant(invoice.status)}>{invoice.status}</Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {invoice.items.map((item) => (
                      <div className="flex items-center justify-between" key={item.id}>
                        <span>
                          {item.name} (x{item.qty})
                        </span>
                        <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">Total</span>
                    <span className="text-lg font-semibold">Rp {invoice.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
              {billing.data.data.length === 0 ? <EmptyBlock message="Belum ada tagihan" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
