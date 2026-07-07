"use client";


/**
 * @file layout.tsx
 * @path apps/frontend/src/app/(app)/layout.tsx
 * @description Layout route /layout.tsx: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ErrorBlock, LoadingBlock } from "@/components/ui/state-block";
import { authStore } from "@/lib/auth-store";
import { hasPatientRole } from "@/lib/role-utils";
import { resolveDashboardPath } from "@/lib/dashboard-routes";
import { fetchMe } from "@/lib/simrs-api";

const titleMap: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  doctors: "Doctors",
  appointments: "Appointments",
  queues: "Queues",
  medicines: "Medicines",
  laboratory: "Laboratory",
  radiology: "Radiology",
  billing: "Billing",
  admin: "Users & Roles",
  files: "Files",
  "activity-log": "Activity Log"
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const [firstSegment, secondSegment] = segments;
    
    // Handle nested paths like /admin/activity-log
    if (firstSegment === "admin" && secondSegment) {
      return titleMap[secondSegment] ?? titleMap[firstSegment] ?? "SIMRS";
    }
    
    if (!firstSegment) return "Dashboard";
    return titleMap[firstSegment] ?? "SIMRS";
  }, [pathname]);

  const handleLogout = () => {
    authStore.clear();
    setHasToken(false);
    router.replace("/login");
  };

  useEffect(() => {
    const token = authStore.getAccessToken();
    setHasToken(Boolean(token));
    setIsHydrated(true);
    if (!token) router.replace("/login");
  }, [router]);

  const me = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    retry: false,
    enabled: isHydrated && hasToken
  });

  useEffect(() => {
    if (!me.isError) return;
    authStore.clear();
    setHasToken(false);
    router.replace("/login");
  }, [me.isError, router]);

  useEffect(() => {
    if (!me.data) return;
    if (hasPatientRole(me.data.roles)) {
      router.replace(resolveDashboardPath(me.data.roles));
    }
  }, [me.data, router]);

  if (!isHydrated || !hasToken) return null;

  if (me.isLoading) {
    return (
      <div className="p-6">
        <LoadingBlock label="Preparing workspace..." />
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

  if (!me.data) {
    return null;
  }

  if (hasPatientRole(me.data.roles)) {
    return null;
  }

  const currentUser = me.data;

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: currentUser.name,
          email: currentUser.email
        }}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pageTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.name}</p>
          </div>
        </header>
        <main className="min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

