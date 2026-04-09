"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deletePatient, getApiErrorMessage, listPatients } from "@/lib/simrs-api";

export default function PatientsListPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const queryKey = useMemo(() => ["patients", { q }], [q]);
  const patients = useQuery({
    queryKey,
    queryFn: () => listPatients({ page: 1, limit: 20, q: q || undefined })
  });

  const del = useMutation({
    mutationFn: async (id: string) => deletePatient(id),
    onSuccess: async () => {
      toast.success("Patient deleted");
      await qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Patients" description="Manage patient master data" actionHref="/patients/new" actionLabel="New patient" />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input placeholder="Search by name or MRN..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Button variant="secondary" onClick={() => patients.refetch()} disabled={patients.isFetching}>
              Search
            </Button>
          </div>

          {patients.isLoading ? <LoadingBlock label="Loading patients..." /> : null}
          {patients.isError ? <ErrorBlock message="Failed to load patients" onRetry={() => patients.refetch()} /> : null}

          {patients.data ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MRN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.data.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.mrn}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.phone ?? "-"}</TableCell>
                      <TableCell>{new Date(p.updatedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/patients/${p.id}/edit`}>Edit</Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => del.mutate(p.id)}
                            disabled={del.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {patients.data.data.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-4" colSpan={5}>
                        <EmptyBlock message="No patients found" />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

