"use client";


/**
 * @file page.tsx
 * @path apps/frontend/src/app/portal/profile/page.tsx
 * @description Halaman route /portal/profile.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { getMyProfile, updateMyProfile } from "@/lib/profile-api";
import { getApiErrorMessage, getMyPatient } from "@/lib/simrs-api";

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

export default function PortalProfilePage() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile
  });

  const patientQuery = useQuery({
    queryKey: ["my-patient"],
    queryFn: getMyPatient
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" }
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
      void queryClient.invalidateQueries({ queryKey: ["auth-me"] });
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

  if (profileQuery.isLoading || patientQuery.isLoading) {
    return <LoadingBlock label="Memuat profil Anda..." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorBlock message={getApiErrorMessage(profileQuery.error)} />;
  }

  const patient = patientQuery.data;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Profil Pasien"
        description="Kelola data akun dan lihat informasi rekam medis Anda"
      />

      {patient ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Rekam Medis</CardTitle>
            <CardDescription>Informasi pasien terdaftar di rumah sakit</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">No. RM</div>
              <div className="font-medium">{patient.mrn}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Nama</div>
              <div className="font-medium">{patient.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Telepon</div>
              <div className="font-medium">{patient.phone ?? "-"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tanggal Lahir</div>
              <div className="font-medium">
                {patient.birthDate
                  ? format(new Date(patient.birthDate), "d MMMM yyyy", { locale: idLocale })
                  : "-"}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-muted-foreground">Alamat</div>
              <div className="font-medium">{patient.address ?? "-"}</div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akun Login</CardTitle>
          <CardDescription>Ubah nama dan email yang digunakan untuk masuk</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={profileForm.handleSubmit((values) => saveProfileMutation.mutate(values))}
            >
              <FormField
                control={profileForm.control}
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
                control={profileForm.control}
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
              <div className="md:col-span-2">
                <Button type="submit" disabled={saveProfileMutation.isPending}>
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
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
          <CardTitle className="text-base">Ubah Password</CardTitle>
          <CardDescription>Gunakan password yang kuat dan unik</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              className="grid max-w-md gap-4"
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
              <Button type="submit" disabled={savePasswordMutation.isPending}>
                {savePasswordMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Ubah Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
