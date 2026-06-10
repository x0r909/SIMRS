"use client";

import { useQuery } from "@tanstack/react-query";
import { listVisits } from "@/lib/simrs-api";
import { LoadingBlock, ErrorBlock } from "@/components/ui/state-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorHistoryPage() {
  const visits = useQuery({ queryKey: ["visits"], queryFn: () => listVisits({ limit: 20 }) });

  if (visits.isLoading) return <LoadingBlock />;
  if (visits.isError) return <ErrorBlock message="Gagal memuat riwayat" />;

  const rows = visits.data?.data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Riwayat Pasien</h1>
      <div className="space-y-3">
        {rows.map((v) => (
          <Card key={v.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{v.patient?.name ?? "Pasien"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {v.complaint ?? "—"} · {new Date(v.startedAt).toLocaleString("id-ID")}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
