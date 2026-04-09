"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Activity, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage, registerPatient } from "@/lib/simrs-api";

const schema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    phone: z.string().min(8, "Nomor telepon minimal 8 digit").optional().or(z.literal("")),
    address: z.string().max(255, "Alamat terlalu panjang").optional().or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      password: "",
      confirmPassword: ""
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      registerPatient({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        address: values.address || undefined,
        birthDate: values.birthDate || undefined
      }),
    onSuccess: (data) => {
      toast.success(`${data.message} Nomor RM: ${data.patient.mrn}`);
      router.push("/patient-login");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(201_84%_56%/.2),transparent_40%),radial-gradient(circle_at_bottom_left,hsl(174_62%_47%/.16),transparent_45%)]" />

      <Card className="relative w-full max-w-2xl border-white/30 bg-white/85 backdrop-blur">
        <CardContent className="p-7 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                <UserPlus className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Sign Up Pasien</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Buat akun pasien untuk memulai pendaftaran berobat di RS Sehat Sentosa.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="ghost">
              <Link className="inline-flex items-center gap-2" href="/">
                <ArrowLeft className="size-4" />
                Kembali
              </Link>
            </Button>
          </div>

          <Form {...form}>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={form.handleSubmit((values) => signupMutation.mutate(values))}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama sesuai identitas" {...field} />
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
                      <Input placeholder="nama@email.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Telepon (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxxxxxxxxx" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir (Opsional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Alamat (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alamat domisili saat ini"
                        {...field}
                        value={field.value ?? ""}
                      />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-1 flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Setelah registrasi berhasil, silakan login melalui halaman login pasien.
                </p>
                <Button className="min-w-44" disabled={signupMutation.isPending} type="submit">
                  {signupMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Activity className="size-4 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    "Buat Akun Pasien"
                  )}
                </Button>
              </div>

              <div className="md:col-span-2">
                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  Sudah punya akun?{" "}
                  <Link className="font-medium text-[hsl(var(--primary))] hover:underline" href="/patient-login">
                    Login pasien
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
