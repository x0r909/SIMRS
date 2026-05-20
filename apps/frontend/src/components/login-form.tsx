"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import * as React from "react";
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
import { NativeCaptcha } from "@/components/native-captcha";
import { authStore } from "@/lib/auth-store";
import { getApiErrorMessage, login as loginRequest } from "@/lib/simrs-api";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter")
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const [captchaSolved, setCaptchaSolved] = React.useState(false);
  const captchaSolvedRef = React.useRef(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      email: "admin@simrs.local", 
      password: "Admin123!"
    }
  });

  const loginMutation = useMutation({
    mutationFn: (values: FormValues) => loginRequest(values),
    onSuccess: (data) => {
      authStore.setTokens(data.accessToken, data.refreshToken);
      toast.success("Login berhasil");
      const nextPath = data.user.roles.includes("patient") ? "/portal" : "/dashboard";
      router.replace(nextPath);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    }
  });

  const handleCaptchaChange = React.useCallback((state: { solved: boolean }) => {
    captchaSolvedRef.current = state.solved;
    setCaptchaSolved(state.solved);
  }, []);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="grid items-stretch p-0 md:grid-cols-2">
          <Form {...form}>
            <form
              className="px-5 py-6 md:px-6 md:py-7"
              onSubmit={form.handleSubmit((values) => {
                if (!captchaSolvedRef.current) {
                  toast.error("Selesaikan captcha terlebih dahulu");
                  return;
                }

                loginMutation.mutate(values);
              })}
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Login Staff</h1>
                  <p className="text-balance text-muted-foreground">
                    Masuk sebagai staff untuk mengelola operasional rumah sakit.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid min-h-[4.75rem] gap-1 text-left">
                      <FormLabel htmlFor="staff-email">Email</FormLabel>
                      <FormControl>
                        <Input id="staff-email" type="email" placeholder="admin@simrs.local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid min-h-[4.75rem] gap-1 text-left">
                      <FormLabel htmlFor="staff-password">Password</FormLabel>
                      <FormControl>
                        <Input id="staff-password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <NativeCaptcha onChange={handleCaptchaChange} />

                <Button type="submit" className="w-full" disabled={loginMutation.isPending || !captchaSolved}>
                  {loginMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Activity className="size-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Login Staff"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Pasien baru?{" "}
                  <Link className="underline underline-offset-4 hover:text-foreground" href="/signup">
                    Daftar akun pasien
                  </Link>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Sudah punya akun pasien?{" "}
                  <Link className="underline underline-offset-4 hover:text-foreground" href="/patient-login">
                    Login pasien
                  </Link>
                </div>
              </div>
            </form>
          </Form>

          <div className="relative hidden bg-muted md:block">
            <Image
              src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80"
              alt="Medical staff"
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
