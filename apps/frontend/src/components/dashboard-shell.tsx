"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  Calendar,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Scan,
  Settings,
  Shield,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { authStore } from "@/lib/auth-store";
import { canAccessPath, resolveLoginPath } from "@/lib/dashboard-routes";
import { roleStore } from "@/lib/role-store";
import { fetchMe } from "@/lib/simrs-api";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  departments: Building2,
  patients: HeartPulse,
  appointments: Calendar,
  queues: ClipboardList,
  billing: Wallet,
  pharmacy: Pill,
  laboratory: FlaskConical,
  radiology: Scan,
  health: Activity,
  backup: Shield,
  settings: Settings,
  soap: Stethoscope
};

export function getNavItems(prefix: string, roleKeys: string[]): NavItem[] {
  const base = `${prefix}`;
  const items: NavItem[] = [{ href: base, label: "Overview", icon: ICONS.dashboard }];

  if (prefix === "/system-admin") {
    return [
      ...items,
      { href: `${base}/users`, label: "Users", icon: ICONS.users },
      { href: `${base}/logs/system`, label: "System Logs", icon: Activity },
      { href: `${base}/logs/audit`, label: "Audit Logs", icon: ClipboardList },
      { href: `${base}/health`, label: "Health", icon: ICONS.health },
      { href: `${base}/backup`, label: "Backup", icon: ICONS.backup },
      { href: `${base}/settings`, label: "Settings", icon: ICONS.settings }
    ];
  }

  if (prefix === "/hospital-admin") {
    return [
      ...items,
      { href: `${base}/staff`, label: "Staff", icon: ICONS.users },
      { href: `${base}/departments`, label: "Departemen", icon: ICONS.departments },
      { href: `${base}/reports/daily`, label: "Laporan", icon: ClipboardList },
      { href: `${base}/settings`, label: "Profil Saya", icon: ICONS.settings }
    ];
  }

  if (prefix === "/doctor") {
    return [
      ...items,
      { href: `${base}/patients`, label: "Patients", icon: ICONS.patients },
      { href: `${base}/schedule`, label: "Schedule", icon: ICONS.appointments },
      { href: `${base}/history`, label: "History", icon: ClipboardList }
    ];
  }

  if (prefix === "/staff") {
    const staffNav: NavItem[] = [...items];
    if (roleKeys.some((r) => ["RECEPTIONIST", "staff"].includes(r))) {
      staffNav.push(
        { href: `${base}/registration`, label: "Registration", icon: ICONS.patients },
        { href: `${base}/queue`, label: "Queue", icon: ICONS.queues },
        { href: `${base}/appointments`, label: "Appointments", icon: ICONS.appointments }
      );
    }
    if (roleKeys.some((r) => ["CASHIER", "cashier"].includes(r))) {
      staffNav.push({ href: `${base}/billing`, label: "Billing", icon: ICONS.billing });
    }
    if (roleKeys.some((r) => ["PHARMACIST", "pharmacy"].includes(r))) {
      staffNav.push({ href: `${base}/pharmacy/orders`, label: "Pharmacy", icon: ICONS.pharmacy });
    }
    if (roleKeys.some((r) => ["LAB_ANALYST", "lab"].includes(r))) {
      staffNav.push({ href: `${base}/laboratory/orders`, label: "Laboratory", icon: ICONS.laboratory });
    }
    if (roleKeys.some((r) => ["RADIOLOGIST", "radiology"].includes(r))) {
      staffNav.push({ href: `${base}/radiology/orders`, label: "Radiology", icon: ICONS.radiology });
    }
    if (roleKeys.some((r) => ["NURSE"].includes(r))) {
      staffNav.push({ href: `${base}/nursing`, label: "Nursing", icon: ICONS.soap });
    }
    return staffNav;
  }

  if (prefix === "/patient") {
    return [
      ...items,
      { href: `${base}/appointments`, label: "Appointments", icon: ICONS.appointments },
      { href: `${base}/medical-records`, label: "Medical Records", icon: ICONS.soap },
      { href: `${base}/lab-results`, label: "Lab Results", icon: ICONS.laboratory },
      { href: `${base}/billing`, label: "Billing", icon: ICONS.billing },
      { href: `${base}/profile`, label: "Profile", icon: ICONS.settings }
    ];
  }

  return items;
}

type DashboardShellProps = {
  children: React.ReactNode;
  prefix: string;
  title?: string;
};

export function DashboardShell({ children, prefix, title }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = authStore.getAccessToken();
    setHasToken(Boolean(token));
    setIsHydrated(true);
    if (!token) router.replace(prefix.startsWith("/patient") ? "/patient-login" : "/login");
  }, [router, prefix]);

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
    router.replace(resolveLoginPath(me.data?.roles ?? []));
  }, [me.isError, me.data?.roles, router]);

  useEffect(() => {
    if (!me.data) return;
    roleStore.setRoles(me.data.roles);
    if (!canAccessPath(me.data.roles, pathname)) {
      router.replace(resolveLoginPath(me.data.roles));
    }
  }, [me.data, pathname, router]);

  const navItems = useMemo(
    () => (me.data ? getNavItems(prefix, me.data.roles) : []),
    [me.data, prefix]
  );

  const pageTitle = useMemo(() => {
    const item = navItems.find((n) => n.href === pathname);
    return item?.label ?? title ?? "SIMRS";
  }, [navItems, pathname, title]);

  const handleLogout = () => {
    authStore.clear();
    roleStore.clear();
    router.replace(prefix.startsWith("/patient") ? "/patient-login" : "/login");
  };

  if (!isHydrated || !hasToken) return null;

  if (me.isLoading) {
    return (
      <div className="p-6">
        <LoadingBlock label="Memuat dashboard..." />
      </div>
    );
  }

  if (me.isError || !me.data) {
    return (
      <div className="p-6">
        <ErrorBlock message="Sesi berakhir, mengalihkan ke login..." />
      </div>
    );
  }

  const sidebarNav = navItems.map((item) => ({
    title: item.label,
    url: item.href,
    icon: item.icon
  }));

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ name: me.data.name, email: me.data.email }}
        onLogout={handleLogout}
        navItems={sidebarNav}
      />
      <SidebarInset>
        <MaintenanceBanner roles={me.data.roles} />
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{pageTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{me.data.name}</p>
          </div>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </header>
        <main className="min-w-0 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-stretch justify-around">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate px-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
