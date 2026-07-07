"use client";


/**
 * @file layout.tsx
 * @path apps/frontend/src/app/portal/layout.tsx
 * @description Layout route /portal: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, CreditCard, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { authStore } from "@/lib/auth-store";
import { hasPatientRole } from "@/lib/role-utils";
import { roleStore } from "@/lib/role-store";
import { fetchMe } from "@/lib/simrs-api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/patient", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "Jadwal Berobat", icon: CalendarDays },
  { href: "/patient/medical-records", label: "Riwayat Kunjungan", icon: ClipboardList },
  { href: "/patient/billing", label: "Tagihan", icon: CreditCard }
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const handleLogout = () => {
    authStore.clear();
    roleStore.clear();
    setHasToken(false);
    router.replace("/patient-login");
  };

  useEffect(() => {
    const token = authStore.getAccessToken();
    setHasToken(Boolean(token));
    setIsHydrated(true);
    if (!token) {
      router.replace("/patient-login");
      return;
    }
    if (pathname.startsWith("/portal")) {
      router.replace(pathname.replace(/^\/portal/, "/patient") || "/patient");
    }
  }, [router, pathname]);

  const me = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    retry: false,
    enabled: isHydrated && hasToken
  });

  useEffect(() => {
    if (!me.isError) return;
    authStore.clear();
    roleStore.clear();
    setHasToken(false);
    router.replace("/patient-login");
  }, [me.isError, router]);

  useEffect(() => {
    if (!me.data) return;
    roleStore.setRoles(me.data.roles);
    if (!hasPatientRole(me.data.roles)) {
      router.replace("/patient-login");
    }
  }, [me.data, router]);

  if (!isHydrated || !hasToken) return null;

  if (me.isLoading) {
    return (
      <div className="p-6">
        <LoadingBlock label="Preparing patient portal..." />
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="p-6">
        <ErrorBlock message="Session expired, redirecting to login..." />
      </div>
    );
  }

  if (!me.data || !hasPatientRole(me.data.roles)) {
    return null;
  }

  const user = me.data;

  return (
    <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/40 p-4 md:flex md:flex-col md:gap-4">
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Portal akun</div>
          <div className="mt-1 font-semibold leading-tight">{user.name}</div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="font-semibold">Portal Pasien</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="size-4" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[hsl(var(--accent))]",
                  active && "bg-[hsl(var(--accent))] font-medium"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Portal Pasien</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{user.name}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs whitespace-nowrap",
                    active ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
