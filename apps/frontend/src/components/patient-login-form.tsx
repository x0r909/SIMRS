"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authStore } from "@/lib/auth-store";
import { getApiErrorMessage, login as loginRequest } from "@/lib/simrs-api";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter")
});

type FormValues = z.infer<typeof schema>;

export function PatientLoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "pasien.andi@simrs.local", password: "Admin123!" }
  });

  const loginMutation = useMutation({
    mutationFn: (values: FormValues) => loginRequest(values),
    onSuccess: (data) => {
      if (!data.user.roles.includes("patient")) {
        authStore.clear();
        toast.error("Akun ini bukan akun pasien. Silakan gunakan login staff.");
        return;
      }

      authStore.setTokens(data.accessToken, data.refreshToken);
      toast.success("Login pasien berhasil");
      router.replace("/portal");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form className="p-6 md:p-8" onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Login Pasien</h1>
                  <p className="text-balance text-muted-foreground">
                    Masuk untuk melihat jadwal berobat, riwayat kunjungan, dan billing pribadi.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2 text-left">
                      <FormLabel htmlFor="patient-email">Email</FormLabel>
                      <FormControl>
                        <Input id="patient-email" type="email" placeholder="pasien.andi@simrs.local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2 text-left">
                      <FormLabel htmlFor="patient-password">Password</FormLabel>
                      <FormControl>
                        <Input id="patient-password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Activity className="size-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Login Pasien"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link className="underline underline-offset-4 hover:text-foreground" href="/signup">
                    Daftar pasien
                  </Link>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Login staff rumah sakit?{" "}
                  <Link className="underline underline-offset-4 hover:text-foreground" href="/login">
                    Gunakan login staff
                  </Link>
                </div>
              </div>
            </form>
          </Form>

          <div className="relative hidden bg-muted md:block">
            <Image
              src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80"
              alt="Patient portal"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 0px, 50vw"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
