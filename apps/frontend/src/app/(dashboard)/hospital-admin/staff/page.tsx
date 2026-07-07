"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/hospital-admin/staff/page.tsx
 * @description Admin RS: kelola staff dan role.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, Loader2, Plus, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
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
  updateHospitalPatientAccount,
  updateHospitalStaff,
  type StaffUser
} from "@/lib/hospital-admin-api";
import { getApiErrorMessage } from "@/lib/simrs-api";

const NONE_DEPARTMENT = "__none__";

const staffSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  roleKey: z.string().min(1, "Pilih role"),
  departmentId: z.string().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional()
});

const patientSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DISABLED"]),
  mrn: z.string().min(1, "No. RM wajib diisi"),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional()
});

type StaffFormValues = z.infer<typeof staffSchema>;
type PatientFormValues = z.infer<typeof patientSchema>;
type UserTab = "staff" | "patients";

const ROLE_LABELS: Record<string, string> = {
  HOSPITAL_ADMIN: "Admin Rumah Sakit",
  DOCTOR: "Dokter",
  NURSE: "Perawat",
  CASHIER: "Kasir",
  PHARMACIST: "Apoteker",
  RADIOLOGIST: "Radiologi",
  LAB_ANALYST: "Lab",
  RECEPTIONIST: "Resepsionis",
  PATIENT: "Pasien"
};

function isPatientUser(user: StaffUser): boolean {
  return user.roles.some((role) => role.key === "PATIENT");
}

function isProtectedStaffUser(user: StaffUser): boolean {
  return user.roles.some((role) => role.key === "HOSPITAL_ADMIN" || role.key === "SYSTEM_ADMIN");
}

function formatBirthDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function HospitalStaffPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<UserTab>("staff");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editingPatient, setEditingPatient] = useState<StaffUser | null>(null);

  const usersQuery = useQuery({
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

  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleKey: "",
      departmentId: NONE_DEPARTMENT,
      status: "ACTIVE"
    }
  });

  const patientForm = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      status: "ACTIVE",
      mrn: "",
      phone: "",
      address: "",
      birthDate: ""
    }
  });

  const { staffUsers, patientUsers } = useMemo(() => {
    const all = usersQuery.data ?? [];
    return {
      staffUsers: all.filter((user) => !isPatientUser(user)),
      patientUsers: all.filter((user) => isPatientUser(user))
    };
  }, [usersQuery.data]);

  const openCreateStaff = () => {
    setEditingStaff(null);
    setEditingPatient(null);
    staffForm.reset({
      name: "",
      email: "",
      password: "",
      roleKey: "",
      departmentId: NONE_DEPARTMENT,
      status: "ACTIVE"
    });
    setDialogOpen(true);
  };

  const openEditStaff = (user: StaffUser) => {
    setEditingStaff(user);
    setEditingPatient(null);
    staffForm.reset({
      name: user.name,
      email: user.email,
      password: "",
      roleKey: user.roles[0]?.key ?? "",
      departmentId: user.departmentId ?? NONE_DEPARTMENT,
      status: user.status as "ACTIVE" | "DISABLED"
    });
    setDialogOpen(true);
  };

  const openEditPatient = (user: StaffUser) => {
    setEditingPatient(user);
    setEditingStaff(null);
    patientForm.reset({
      name: user.name,
      email: user.email,
      password: "",
      status: user.status as "ACTIVE" | "DISABLED",
      mrn: user.patientProfile?.mrn ?? "",
      phone: user.patientProfile?.phone ?? "",
      address: user.patientProfile?.address ?? "",
      birthDate: formatBirthDateInput(user.patientProfile?.birthDate)
    });
    setDialogOpen(true);
  };

  const saveStaffMutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      const departmentId =
        values.departmentId && values.departmentId !== NONE_DEPARTMENT ? values.departmentId : null;

      if (editingStaff) {
        const payload: Parameters<typeof updateHospitalStaff>[1] = {
          name: values.name,
          email: values.email,
          password: values.password || undefined,
          status: values.status,
          departmentId
        };
        if (!isProtectedStaffUser(editingStaff)) {
          payload.roleKeys = [values.roleKey];
        }
        return updateHospitalStaff(editingStaff.id, payload);
      }

      if (!values.password) {
        throw new Error("Password wajib diisi untuk staff baru");
      }
      return createHospitalStaff({
        name: values.name,
        email: values.email,
        password: values.password,
        roleKeys: [values.roleKey],
        departmentId: departmentId ?? undefined
      });
    },
    onSuccess: () => {
      toast.success(editingStaff ? "Staff diperbarui" : "Staff ditambahkan");
      setDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["hospital-staff"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const savePatientMutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      if (!editingPatient?.patientProfile?.id) {
        throw new Error("Profil pasien tidak ditemukan untuk akun ini");
      }
      await updateHospitalPatientAccount(editingPatient.id, editingPatient.patientProfile.id, {
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        status: values.status,
        mrn: values.mrn,
        phone: values.phone,
        address: values.address,
        birthDate: values.birthDate || undefined
      });
    },
    onSuccess: () => {
      toast.success("Data pasien diperbarui");
      setDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["hospital-staff"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  if (usersQuery.isLoading || rolesQuery.isLoading) {
    return <LoadingBlock label="Memuat data pengguna..." />;
  }

  if (usersQuery.isError) {
    return <ErrorBlock message={getApiErrorMessage(usersQuery.error)} />;
  }

  const roles = rolesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const visibleUsers = activeTab === "staff" ? staffUsers : patientUsers;
  const isPatientDialog = Boolean(editingPatient);
  const isProtectedStaff = editingStaff ? isProtectedStaffUser(editingStaff) : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pengguna Rumah Sakit</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun staff operasional dan pasien terdaftar di rumah sakit Anda.
          </p>
        </div>
        {activeTab === "staff" ? (
          <Button onClick={openCreateStaff}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Staff
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "staff" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("staff")}
        >
          Staff ({staffUsers.length})
        </Button>
        <Button
          variant={activeTab === "patients" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("patients")}
        >
          Pasien ({patientUsers.length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {activeTab === "staff" ? "Daftar Staff" : "Daftar Pasien"} ({visibleUsers.length})
          </CardTitle>
          <CardDescription>
            {activeTab === "staff"
              ? "Tenaga medis dan operasional. Admin sistem tidak ditampilkan."
              : "Akun portal pasien yang terhubung ke rekam medis rumah sakit Anda."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {activeTab === "staff"
                ? "Belum ada staff terdaftar."
                : "Belum ada pasien terdaftar di rumah sakit ini."}
            </p>
          ) : (
            visibleUsers.map((user) => {
              const Icon = isPatientUser(user) ? HeartPulse : UserCog;
              return (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.patientProfile?.mrn ? (
                        <p className="text-xs text-muted-foreground">RM: {user.patientProfile.mrn}</p>
                      ) : null}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      isPatientUser(user) ? openEditPatient(user) : openEditStaff(user)
                    }
                  >
                    Edit
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {isPatientDialog
                ? "Edit Pasien"
                : editingStaff
                  ? "Edit Staff"
                  : "Tambah Staff"}
            </SheetTitle>
          </SheetHeader>

          {isPatientDialog ? (
            <Form {...patientForm}>
              <form
                className="space-y-4"
                onSubmit={patientForm.handleSubmit((values) => savePatientMutation.mutate(values))}
              >
                <FormField
                  control={patientForm.control}
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
                  control={patientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email login</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={patientForm.control}
                  name="mrn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Rekam Medis</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={patientForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telepon</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={patientForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Lahir</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={patientForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={patientForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password baru (opsional)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={patientForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status akun</FormLabel>
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
                <SheetFooter className="pt-4">
                  <Button type="submit" disabled={savePatientMutation.isPending}>
                    {savePatientMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Simpan
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          ) : (
            <Form {...staffForm}>
              <form
                className="space-y-4"
                onSubmit={staffForm.handleSubmit((values) => saveStaffMutation.mutate(values))}
              >
                <FormField
                  control={staffForm.control}
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
                  control={staffForm.control}
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
                  control={staffForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{editingStaff ? "Password baru (opsional)" : "Password"}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={staffForm.control}
                  name="roleKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isProtectedStaff}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(isProtectedStaff
                            ? editingStaff?.roles.map((role) => ({
                                key: role.key,
                                name: ROLE_LABELS[role.key] ?? role.name
                              })) ?? []
                            : roles
                          ).map((role) => (
                            <SelectItem key={role.key} value={role.key}>
                              {ROLE_LABELS[role.key] ?? role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isProtectedStaff ? (
                        <p className="text-xs text-muted-foreground">
                          Role admin rumah sakit tidak dapat diubah dari sini.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={staffForm.control}
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
                          <SelectItem value={NONE_DEPARTMENT}>— Tidak ada —</SelectItem>
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
                {editingStaff ? (
                  <FormField
                    control={staffForm.control}
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
                ) : null}
                <SheetFooter className="pt-4">
                  <Button type="submit" disabled={saveStaffMutation.isPending}>
                    {saveStaffMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Simpan
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
