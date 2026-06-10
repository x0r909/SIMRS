"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Power, PowerOff, Save, Settings2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { getApiErrorMessage } from "@/lib/simrs-api";
import {
  getSystemSettings,
  updateMaintenanceMode,
  updateSystemSettings,
  type MaintenanceScope
} from "@/lib/system-settings-api";

const MAINTENANCE_SCOPE_OPTIONS: {
  value: MaintenanceScope;
  label: string;
  description: string;
}[] = [
  {
    value: "registration",
    label: "Registrasi saja",
    description: "Blokir pendaftaran pasien baru. Staff dan pasien yang sudah login tetap bisa akses."
  },
  {
    value: "patients",
    label: "Portal pasien",
    description: "Blokir signup, login pasien, dan portal pasien. Staff tetap beroperasi."
  },
  {
    value: "full",
    label: "Maintenance penuh",
    description: "Hanya System Admin yang dapat login dan mengakses sistem."
  }
];

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const settingsSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  address: z.string().min(5, "Alamat wajib diisi"),
  phone: z.string().min(8, "Telepon wajib diisi"),
  email: z.string().email("Email tidak valid"),
  logoUrl: z.string().url("URL tidak valid").or(z.literal("")),
  maintenanceMode: z.boolean(),
  maintenanceScope: z.enum(["registration", "patients", "full"]),
  maintenanceMessage: z.string(),
  maintenanceEndsAt: z.string(),
  allowPatientRegistration: z.boolean(),
  backupRetentionDays: z.coerce.number().int().min(1).max(365),
  timezone: z.string().min(1),
  locale: z.string().min(1),
  operatingHoursOpen: z.string().min(1),
  operatingHoursClose: z.string().min(1)
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours} jam ${rem} menit` : `${hours} jam`;
}

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSystemSettings
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      logoUrl: "",
      maintenanceMode: false,
      maintenanceScope: "registration",
      maintenanceMessage: "",
      maintenanceEndsAt: "",
      allowPatientRegistration: true,
      backupRetentionDays: 30,
      timezone: "Asia/Jakarta",
      locale: "id-ID",
      operatingHoursOpen: "07:00",
      operatingHoursClose: "21:00"
    }
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    const { hospital, operational } = settingsQuery.data;
    form.reset({
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone,
      email: hospital.email,
      logoUrl: hospital.logoUrl ?? "",
      maintenanceMode: operational.maintenanceMode,
      maintenanceScope: operational.maintenanceScope ?? "registration",
      maintenanceMessage: operational.maintenanceMessage,
      maintenanceEndsAt: toDatetimeLocalValue(operational.maintenanceEndsAt),
      allowPatientRegistration: operational.allowPatientRegistration,
      backupRetentionDays: operational.backupRetentionDays,
      timezone: operational.timezone,
      locale: operational.locale,
      operatingHoursOpen: operational.operatingHoursOpen,
      operatingHoursClose: operational.operatingHoursClose
    });
  }, [settingsQuery.data, form]);

  const syncMaintenanceForm = (data: Awaited<ReturnType<typeof getSystemSettings>>) => {
    const { hospital, operational } = data;
    form.reset({
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone,
      email: hospital.email,
      logoUrl: hospital.logoUrl ?? "",
      maintenanceMode: operational.maintenanceMode,
      maintenanceScope: operational.maintenanceScope ?? "registration",
      maintenanceMessage: operational.maintenanceMessage,
      maintenanceEndsAt: toDatetimeLocalValue(operational.maintenanceEndsAt),
      allowPatientRegistration: operational.allowPatientRegistration,
      backupRetentionDays: operational.backupRetentionDays,
      timezone: operational.timezone,
      locale: operational.locale,
      operatingHoursOpen: operational.operatingHoursOpen,
      operatingHoursClose: operational.operatingHoursClose
    });
  };

  const maintenanceConfigMutation = useMutation({
    mutationFn: () => {
      const values = form.getValues();
      return updateMaintenanceMode({
        enabled: values.maintenanceMode,
        scope: values.maintenanceScope,
        message: values.maintenanceMessage,
        endsAt: fromDatetimeLocalValue(values.maintenanceEndsAt)
      });
    },
    onSuccess: (data) => {
      syncMaintenanceForm(data);
      toast.success("Pengaturan maintenance disimpan");
      void queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["public-system-settings"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    }
  });

  const maintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      const values = form.getValues();
      return updateMaintenanceMode({
        enabled,
        scope: values.maintenanceScope,
        message: values.maintenanceMessage,
        endsAt: enabled ? fromDatetimeLocalValue(values.maintenanceEndsAt) : null
      });
    },
    onSuccess: (data, enabled) => {
      syncMaintenanceForm(data);
      toast.success(
        enabled ? "Mode maintenance diaktifkan" : "Mode maintenance dimatikan"
      );
      void queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["public-system-settings"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    }
  });

  const saveMutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      updateSystemSettings({
        profile: {
          name: values.name,
          address: values.address,
          phone: values.phone,
          email: values.email,
          logoUrl: values.logoUrl || undefined
        },
        operational: {
          maintenanceMode: values.maintenanceMode,
          maintenanceScope: values.maintenanceScope,
          maintenanceMessage: values.maintenanceMessage,
          maintenanceEndsAt: fromDatetimeLocalValue(values.maintenanceEndsAt),
          allowPatientRegistration: values.allowPatientRegistration,
          backupRetentionDays: values.backupRetentionDays,
          timezone: values.timezone,
          locale: values.locale,
          operatingHoursOpen: values.operatingHoursOpen,
          operatingHoursClose: values.operatingHoursClose
        }
      }),
    onSuccess: () => {
      toast.success("Pengaturan berhasil disimpan");
      void queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["public-system-settings"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    }
  });

  if (settingsQuery.isLoading) {
    return <LoadingBlock label="Memuat pengaturan sistem..." />;
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return <ErrorBlock message={getApiErrorMessage(settingsQuery.error)} />;
  }

  const runtime = settingsQuery.data.runtime;
  const maintenanceActive = form.watch("maintenanceMode");
  const maintenanceScope = form.watch("maintenanceScope");
  const selectedScope = MAINTENANCE_SCOPE_OPTIONS.find((o) => o.value === maintenanceScope);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil institusi, operasional platform, dan lihat konfigurasi runtime.
        </p>
      </div>

      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil Institusi</CardTitle>
              <CardDescription>
                Informasi rumah sakit yang ditampilkan di portal dan dokumen.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nama Rumah Sakit</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
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
                    <FormLabel>Telepon</FormLabel>
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
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>URL Logo (opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className={maintenanceActive ? "border-amber-300 bg-amber-50/30" : undefined}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Mode Maintenance</CardTitle>
                  <CardDescription>
                    Atur cakupan dan pesan terlebih dahulu, lalu nyalakan maintenance. Perubahan
                    cakupan/pesan dapat disimpan kapan saja.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {maintenanceActive ? (
                    <Badge variant="warning">Aktif</Badge>
                  ) : (
                    <Badge variant="outline">Nonaktif</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Status saat ini: {maintenanceActive ? "Maintenance aktif" : "Sistem normal"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gunakan tombol nyala/matikan untuk mengubah status. Simpan konfigurasi untuk
                    menyimpan cakupan, pesan, dan estimasi selesai.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      maintenanceConfigMutation.isPending || maintenanceMutation.isPending
                    }
                    onClick={() => maintenanceConfigMutation.mutate()}
                  >
                    {maintenanceConfigMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings2 className="mr-2 h-4 w-4" />
                    )}
                    Simpan Konfigurasi
                  </Button>
                  {!maintenanceActive ? (
                    <Button
                      type="button"
                      variant="default"
                      className="bg-amber-600 hover:bg-amber-700"
                      disabled={maintenanceMutation.isPending}
                      onClick={() => maintenanceMutation.mutate(true)}
                    >
                      {maintenanceMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="mr-2 h-4 w-4" />
                      )}
                      Nyalakan Maintenance
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={maintenanceMutation.isPending}
                      onClick={() => maintenanceMutation.mutate(false)}
                    >
                      {maintenanceMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PowerOff className="mr-2 h-4 w-4" />
                      )}
                      Matikan Maintenance
                    </Button>
                  )}
                </div>
              </div>

              <input type="hidden" {...form.register("maintenanceMode")} />
              <FormField
                control={form.control}
                name="maintenanceScope"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Cakupan Maintenance</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value as MaintenanceScope)}
                      >
                        {MAINTENANCE_SCOPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {selectedScope && (
                      <FormDescription>{selectedScope.description}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Pesan untuk Pengguna</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Sistem sedang dalam pemeliharaan. Perkiraan selesai pukul 18:00 WIB."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenanceEndsAt"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Estimasi Selesai (opsional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maintenance otomatis nonaktif setelah waktu ini (diperiksa server setiap
                      request).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 md:col-span-2">
                  <p className="font-medium">Pratinjau dampak</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {maintenanceScope === "registration" && (
                      <>
                        <li>Halaman /signup diblokir</li>
                        <li>Staff dan pasien yang sudah login tidak terpengaruh</li>
                      </>
                    )}
                    {maintenanceScope === "patients" && (
                      <>
                        <li>Signup dan login pasien diblokir</li>
                        <li>Portal /patient dialihkan ke halaman maintenance</li>
                        <li>Staff tetap dapat bekerja</li>
                      </>
                    )}
                    {maintenanceScope === "full" && (
                      <>
                        <li>Hanya System Admin yang dapat login</li>
                        <li>Semua dashboard staff/pasien dialihkan ke maintenance</li>
                        <li>API mengembalikan HTTP 503 untuk pengguna lain</li>
                      </>
                    )}
                  </ul>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operasional</CardTitle>
              <CardDescription>Registrasi pasien dan jam operasional rumah sakit.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="allowPatientRegistration"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                    <div>
                      <FormLabel>Registrasi Pasien Online</FormLabel>
                      <FormDescription>
                        Izinkan pendaftaran akun pasien melalui halaman signup.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatingHoursOpen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam Buka</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatingHoursClose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam Tutup</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="backupRetentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retensi Backup (hari)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={365} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Waktu</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locale</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Runtime & Keamanan</CardTitle>
              <CardDescription>
                Nilai berikut dikelola melalui environment variables server (read-only).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Environment</p>
                <Badge variant="outline" className="mt-1">
                  {runtime.nodeEnv}
                </Badge>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Access Token TTL</p>
                <p className="mt-1 font-medium">{formatMinutes(runtime.jwtAccessTtlSeconds)}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Refresh Token TTL</p>
                <p className="mt-1 font-medium">
                  {formatMinutes(runtime.jwtRefreshTtlSeconds)}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Maks. Sesi per User</p>
                <p className="mt-1 font-medium">{runtime.maxConcurrentSessions}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Log Level</p>
                <p className="mt-1 font-medium">{runtime.logLevel}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Prometheus Metrics</p>
                <Badge
                  variant={runtime.prometheusEnabled ? "success" : "outline"}
                  className="mt-1"
                >
                  {runtime.prometheusEnabled ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
