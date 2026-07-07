"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/hospital-admin/departments/page.tsx
 * @description Admin RS: kelola departemen/poli.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  type Department
} from "@/lib/hospital-admin-api";
import { getApiErrorMessage } from "@/lib/simrs-api";

const deptSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  code: z.string().min(2, "Kode minimal 2 karakter").max(12, "Kode maksimal 12 karakter"),
  description: z.string().optional()
});

type DeptFormValues = z.infer<typeof deptSchema>;

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const deptsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments
  });

  const form = useForm<DeptFormValues>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", code: "", description: "" }
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", code: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    form.reset({
      name: dept.name,
      code: dept.code,
      description: dept.description ?? ""
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: DeptFormValues) =>
      editing
        ? updateDepartment(editing.id, {
            name: values.name,
            description: values.description
          })
        : createDepartment(values),
    onSuccess: () => {
      toast.success(editing ? "Departemen diperbarui" : "Departemen ditambahkan");
      setDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  if (deptsQuery.isLoading) return <LoadingBlock label="Memuat departemen..." />;
  if (deptsQuery.isError) return <ErrorBlock message={getApiErrorMessage(deptsQuery.error)} />;

  const list = deptsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Departemen</h1>
          <p className="text-sm text-muted-foreground">
            Kelola unit dan poli di rumah sakit Anda.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Departemen
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada departemen. Tambahkan departemen pertama.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((dept) => (
            <Card key={dept.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{dept.name}</CardTitle>
                      <CardDescription>Kode: {dept.code}</CardDescription>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(dept)}>
                    Edit
                  </Button>
                </div>
              </CardHeader>
              {dept.description && (
                <CardContent className="text-sm text-muted-foreground">{dept.description}</CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Departemen" : "Tambah Departemen"}</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={Boolean(editing)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (opsional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SheetFooter className="pt-4">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
