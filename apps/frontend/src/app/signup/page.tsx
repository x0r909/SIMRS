"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Activity, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaptchaField } from "@/components/captcha-field";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { getApiErrorMessage, registerPatient } from "@/lib/simrs-api";
import { validatePasswordStrength } from "@/lib/password-validator";

const passwordSchema = z
  .string()
  .min(12, "Password minimal 12 karakter")
  .regex(/[a-z]/, "Password harus mengandung huruf kecil")
  .regex(/[A-Z]/, "Password harus mengandung huruf besar")
  .regex(/\d/, "Password harus mengandung angka")
  .regex(/[^A-Za-z0-9]/, "Password harus mengandung simbol");

const schema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    email: z.string().trim().email("Format email tidak valid"),
    phone: z.string().min(8, "Nomor telepon minimal 8 digit").optional().or(z.literal("")),
    address: z.string().max(255, "Alamat terlalu panjang").optional().or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    captchaId: z.string().min(1, "Captcha ID wajib diisi"),
    captchaAnswer: z.string().min(1, "Jawaban captcha wajib diisi")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [captchaError, setCaptchaError] = useState<string>();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      password: "",
      confirmPassword: "",
      captchaId: "",
      captchaAnswer: ""
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      registerPatient({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        captchaId: values.captchaId,
        captchaAnswer: values.captchaAnswer,
        phone: values.phone || undefined,
        address: values.address || undefined,
        birthDate: values.birthDate || undefined
      }),
    onSuccess: (data) => {
      toast.success(`${data.message} Nomor RM: ${data.patient.mrn}`);
      router.push("/patient-login");
    },
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error);
      toast.error(errorMessage);
      // If captcha error, trigger refresh
      if (errorMessage.toLowerCase().includes("captcha")) {
        setCaptchaError(errorMessage);
      }
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Buat password yang kuat" {...field} />
                    </FormControl>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Minimal 12 karakter, wajib ada huruf besar, huruf kecil, angka, dan simbol.
                    </p>
                    <FormMessage />
                    <PasswordStrengthIndicator control={form.control} passwordFieldName="password" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ulangi password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="captchaId"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />

              <FormField
                control={form.control}
                name="captchaAnswer"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />

              <CaptchaField
                watch={form.watch}
                setValue={form.setValue}
                onCaptchaChange={(captchaId, captchaAnswer) => {
                  form.setValue("captchaId", captchaId);
                  form.setValue("captchaAnswer", captchaAnswer);
                  setCaptchaError(undefined);
                }}
                error={captchaError || form.formState.errors.captchaAnswer?.message}
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
