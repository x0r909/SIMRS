"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(dashboard)/hospital-admin/settings/page.tsx
 * @description Admin RS: pengaturan institusi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Info, Loader2, Save, Shield } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { getMyProfile, ROLE_LABELS, updateMyProfile } from "@/lib/profile-api";
import { getApiErrorMessage } from "@/lib/simrs-api";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid")
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    password: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi")
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"]
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function HospitalAdminProfilePage() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    profileForm.reset({
      name: profileQuery.data.name,
      email: profileQuery.data.email
    });
  }, [profileQuery.data, profileForm]);

  const saveProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateMyProfile({ name: values.name, email: values.email }),
    onSuccess: () => {
      toast.success("Profil berhasil disimpan");
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const savePasswordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      updateMyProfile({
        password: values.password,
        currentPassword: values.currentPassword
      }),
    onSuccess: () => {
      toast.success("Password berhasil diubah");
      passwordForm.reset();
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  if (profileQuery.isLoading) return <LoadingBlock label="Memuat profil Anda..." />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorBlock message={getApiErrorMessage(profileQuery.error)} />;
  }

  const profile = profileQuery.data;
  const primaryRole = profile.roles[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola data pribadi akun Anda sebagai pengguna dengan akses Admin Rumah Sakit. Pengaturan
          sistem dan profil institusi dikelola oleh Admin Sistem.
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex gap-3 p-4 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Admin Rumah Sakit</strong> adalah peran pada akun pengguna (bukan akun sistem).
            Anda mengelola operasional RS; konfigurasi platform tetap di menu Admin Sistem.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Akun</CardTitle>
          <CardDescription>Data penugasan dan status login Anda (read-only).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Peran</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Status</p>
            <Badge className="mt-1" variant={profile.status === "ACTIVE" ? "success" : "danger"}>
              {profile.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Rumah Sakit</p>
            <p className="mt-1 font-medium">{profile.hospital?.name ?? "—"}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">Departemen</p>
            <p className="mt-1 font-medium">{profile.department?.name ?? "—"}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm sm:col-span-2">
            <p className="text-muted-foreground">Login terakhir</p>
            <p className="mt-1 font-medium">
              {profile.lastLoginAt
                ? format(new Date(profile.lastLoginAt), "dd MMM yyyy, HH:mm", { locale: idLocale })
                : "—"}
            </p>
          </div>
          {profile.mfaEnabled && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2">
              <Shield className="h-4 w-4" />
              MFA (autentikasi dua faktor) aktif pada akun ini
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Pribadi</CardTitle>
          <CardDescription>
            Nama dan email untuk identitas login Anda
            {primaryRole ? ` sebagai ${ROLE_LABELS[primaryRole] ?? primaryRole}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={profileForm.handleSubmit((values) => saveProfileMutation.mutate(values))}
            >
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Login</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Button type="submit" disabled={saveProfileMutation.isPending}>
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Simpan Profil
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keamanan Akun</CardTitle>
          <CardDescription>Ganti password login Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={passwordForm.handleSubmit((values) => savePasswordMutation.mutate(values))}
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Saat Ini</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Baru</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>Minimal 8 karakter.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password Baru</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Button type="submit" variant="outline" disabled={savePasswordMutation.isPending}>
                  {savePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Ubah Password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
