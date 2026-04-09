import { Activity, ArrowRight, CalendarCheck2, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    title: "Pendaftaran Cepat",
    description: "Daftar sebagai pasien baru dalam hitungan menit dan mulai proses berobat tanpa antre panjang.",
    icon: CalendarCheck2
  },
  {
    title: "Tim Medis Terkoneksi",
    description: "Data pasien, jadwal dokter, dan hasil pemeriksaan saling terhubung di satu sistem.",
    icon: Stethoscope
  },
  {
    title: "Keamanan Data",
    description: "Akses berbasis peran dengan pencatatan aktivitas untuk menjaga kerahasiaan rekam medis.",
    icon: ShieldCheck
  }
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,hsl(201_84%_56%/.22),transparent_45%),radial-gradient(circle_at_90%_5%,hsl(174_62%_47%/.22),transparent_35%),radial-gradient(circle_at_55%_92%,hsl(35_92%_55%/.12),transparent_38%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-16 pt-6 md:px-10 md:pb-24 md:pt-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/70 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <HeartPulse className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none md:text-base">RS Sehat Sentosa</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Sistem Informasi Manajemen Rumah Sakit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/signup">Daftar Pasien</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/patient-login">Login Pasien</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Login Staff</Link>
            </Button>
          </div>
        </header>

        <main className="mt-10 grid items-center gap-8 md:mt-16 md:grid-cols-[1.1fr_.9fr] md:gap-12">
          <section className="space-y-6">
            <Badge className="w-fit" variant="outline">
              Terintegrasi dari front office sampai klinis
            </Badge>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                Layanan Rumah Sakit yang Lebih Cepat, Nyaman, dan Tertata
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[hsl(var(--muted-foreground))] md:text-lg">
                Pasien dapat membuat akun untuk memulai pendaftaran berobat, sementara staff rumah sakit mengelola
                antrian, kunjungan, laboratorium, radiologi, dan billing dari satu dashboard terpadu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="h-11 px-5 text-sm md:text-base">
                <Link className="inline-flex items-center gap-2" href="/signup">
                  Sign Up Pasien
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild className="h-11 px-5 text-sm md:text-base" variant="outline">
                <Link href="/patient-login">Login Pasien</Link>
              </Button>
              <Button asChild className="h-11 px-5 text-sm md:text-base" variant="outline">
                <Link href="/login">Masuk sebagai Staff</Link>
              </Button>
            </div>
          </section>

          <Card className="border-white/30 bg-white/80 shadow-lg backdrop-blur">
            <CardContent className="space-y-5 p-6 md:p-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--primary))]">
                <Activity className="size-3.5" />
                Status Layanan Hari Ini
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Poli Aktif</p>
                  <p className="mt-1 text-2xl font-semibold">8</p>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Antrian Berjalan</p>
                  <p className="mt-1 text-2xl font-semibold">42</p>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Dokter Bertugas</p>
                  <p className="mt-1 text-2xl font-semibold">16</p>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Kunjungan Selesai</p>
                  <p className="mt-1 text-2xl font-semibold">127</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <section className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card className="border-white/30 bg-white/75 backdrop-blur" key={item.title}>
                <CardContent className="space-y-3 p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                    <Icon className="size-5 text-[hsl(var(--primary))]" />
                  </div>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}

