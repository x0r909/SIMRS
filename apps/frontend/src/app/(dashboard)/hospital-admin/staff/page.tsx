"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import {
  createHospitalStaff,
  listAssignableStaffRoles,
  listDepartments,
  listHospitalStaff,
  updateHospitalStaff,
  type StaffUser
} from "@/lib/hospital-admin-api";
import { getApiErrorMessage } from "@/lib/simrs-api";

const staffSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  roleKey: z.string().min(1, "Pilih role"),
  departmentId: z.string().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional()
});

type StaffFormValues = z.infer<typeof staffSchema>;

const ROLE_LABELS: Record<string, string> = {
  DOCTOR: "Dokter",
  NURSE: "Perawat",
  CASHIER: "Kasir",
  PHARMACIST: "Apoteker",
  RADIOLOGIST: "Radiologi",
  LAB_ANALYST: "Lab",
  RECEPTIONIST: "Resepsionis"
};

export default function HospitalStaffPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);

  const staffQuery = useQuery({
    queryKey: ["hospital-staff"],
    queryFn: listHospitalStaff
  });

  const rolesQuery = useQuery({
    queryKey: ["hospital-assignable-roles"],
    queryFn: listAssignableStaffRoles
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleKey: "",
      departmentId: "",
      status: "ACTIVE"
    }
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      email: "",
      password: "",
      roleKey: "",
      departmentId: "",
      status: "ACTIVE"
    });
    setDialogOpen(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditing(user);
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      roleKey: user.roles[0]?.key ?? "",
      departmentId: user.departmentId ?? "",
      status: user.status as "ACTIVE" | "DISABLED"
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      if (editing) {
        return updateHospitalStaff(editing.id, {
          name: values.name,
          email: values.email,
          password: values.password || undefined,
          status: values.status,
          roleKeys: [values.roleKey],
          departmentId: values.departmentId || null
        });
      }
      if (!values.password) {
        throw new Error("Password wajib diisi untuk staff baru");
      }
      return createHospitalStaff({
        name: values.name,
        email: values.email,
        password: values.password,
        roleKeys: [values.roleKey],
        departmentId: values.departmentId || undefined
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Staff diperbarui" : "Staff ditambahkan");
      setDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["hospital-staff"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  if (staffQuery.isLoading || rolesQuery.isLoading) {
    return <LoadingBlock label="Memuat data staff..." />;
  }

  if (staffQuery.isError) {
    return <ErrorBlock message={getApiErrorMessage(staffQuery.error)} />;
  }

  const staff = staffQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Staff Rumah Sakit</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun tenaga medis dan operasional di rumah sakit Anda.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Staff ({staff.length})</CardTitle>
          <CardDescription>
            Hanya menampilkan staff di rumah sakit Anda. System admin tidak ditampilkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {staff.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada staff terdaftar. Tambahkan staff pertama Anda.
            </p>
          ) : (
            staff.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <UserCog className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="outline">
                          {ROLE_LABELS[role.key] ?? role.name}
                        </Badge>
                      ))}
                      <Badge variant={user.status === "ACTIVE" ? "success" : "danger"}>
                        {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                  Edit
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Staff" : "Tambah Staff"}</SheetTitle>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editing ? "Password baru (opsional)" : "Password"}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.key} value={role.key}>
                            {ROLE_LABELS[role.key] ?? role.name}
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
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departemen (opsional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih departemen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">— Tidak ada —</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Aktif</SelectItem>
                          <SelectItem value="DISABLED">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
