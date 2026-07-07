/**
 * @file middleware.ts
 * @path apps/frontend/src/middleware.ts
 * @description Next.js middleware: auth guard, maintenance redirect, role routing.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/patient-login", "/signup", "/api", "/", "/maintenance"];

const STAFF_PREFIXES = ["/system-admin", "/hospital-admin", "/doctor", "/staff", "/dashboard", "/admin"];
const PATIENT_PREFIXES = ["/patient", "/portal"];

type PublicSettings = {
  maintenanceMode?: boolean;
  maintenanceScope?: "registration" | "patients" | "full";
  maintenanceMessage?: string;
};

function getRolesFromCookie(request: NextRequest): string[] {
  const raw = request.cookies.get("simrs_roles")?.value;
  if (!raw) return [];
  return decodeURIComponent(raw).split(",").filter(Boolean);
}

function isSystemAdmin(roles: string[]): boolean {
  return roles.includes("SYSTEM_ADMIN") || roles.includes("admin");
}

function hasPatientRole(roles: string[]): boolean {
  return roles.some((role) => role.toUpperCase() === "PATIENT");
}

function hasStaffLoginRole(roles: string[]): boolean {
  const staffRoles = new Set([
    "SYSTEM_ADMIN",
    "HOSPITAL_ADMIN",
    "DOCTOR",
    "NURSE",
    "CASHIER",
    "PHARMACIST",
    "RADIOLOGIST",
    "LAB_ANALYST",
    "RECEPTIONIST",
    "admin",
    "doctor",
    "staff",
    "pharmacy",
    "radiology",
    "lab",
    "cashier"
  ]);
  return roles.some((role) => staffRoles.has(role) || staffRoles.has(role.toUpperCase()));
}

function roleHome(roles: string[]): string | null {
  const order = [
    "SYSTEM_ADMIN",
    "admin",
    "HOSPITAL_ADMIN",
    "DOCTOR",
    "doctor",
    "NURSE",
    "CASHIER",
    "PHARMACIST",
    "RADIOLOGIST",
    "LAB_ANALYST",
    "RECEPTIONIST",
    "staff",
    "PATIENT",
    "patient"
  ];
  const map: Record<string, string> = {
    SYSTEM_ADMIN: "/system-admin",
    admin: "/system-admin",
    HOSPITAL_ADMIN: "/hospital-admin",
    DOCTOR: "/doctor",
    doctor: "/doctor",
    NURSE: "/staff",
    CASHIER: "/staff",
    PHARMACIST: "/staff",
    RADIOLOGIST: "/staff",
    LAB_ANALYST: "/staff",
    RECEPTIONIST: "/staff",
    staff: "/staff",
    PATIENT: "/patient",
    patient: "/patient"
  };
  for (const role of order) {
    if (roles.includes(role) && map[role]) return map[role];
  }
  return null;
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function canAccessStaffPath(roles: string[], pathname: string): boolean {
  if (isSystemAdmin(roles)) return true;

  if (pathname.startsWith("/system-admin") || pathname.startsWith("/admin")) {
    return false;
  }
  if (pathname.startsWith("/hospital-admin")) {
    return roles.includes("HOSPITAL_ADMIN");
  }
  if (pathname.startsWith("/doctor")) {
    return roles.includes("DOCTOR") || roles.includes("doctor");
  }
  if (pathname.startsWith("/staff")) {
    const staffOnly = new Set([
      "NURSE",
      "CASHIER",
      "PHARMACIST",
      "RADIOLOGIST",
      "LAB_ANALYST",
      "RECEPTIONIST",
      "staff",
      "pharmacy",
      "radiology",
      "lab",
      "cashier"
    ]);
    return roles.some((r) => staffOnly.has(r) || staffOnly.has(r.toUpperCase()));
  }

  return hasStaffLoginRole(roles);
}

function resolveServerApiBase(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal.replace(/\/+$/, "");
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://127.0.0.1:4000";
}

async function fetchMaintenanceStatus(): Promise<PublicSettings | null> {
  const apiBase = resolveServerApiBase();
  try {
    const response = await fetch(`${apiBase}/v1/system/settings/public`, {
      next: { revalidate: 10 }
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: PublicSettings } & PublicSettings;
    return json.data ?? json;
  } catch {
    return null;
  }
}

function shouldRedirectToMaintenance(
  maintenance: PublicSettings,
  pathname: string,
  roles: string[]
): boolean {
  if (!maintenance.maintenanceMode) return false;
  if (pathname === "/maintenance") return false;
  if (isSystemAdmin(roles)) return false;

  const scope = maintenance.maintenanceScope ?? "registration";

  if (scope === "registration") {
    return pathname === "/signup" || pathname.startsWith("/signup/");
  }

  if (scope === "patients") {
    if (pathname === "/signup" || pathname.startsWith("/signup/")) return true;
    if (matchesPrefix(pathname, PATIENT_PREFIXES)) return true;
    if (pathname === "/patient-login" || pathname.startsWith("/patient-login/")) return true;
    return hasPatientRole(roles) && matchesPrefix(pathname, PATIENT_PREFIXES);
  }

  // full
  if (pathname === "/login" || pathname.startsWith("/login/")) return false;
  if (matchesPrefix(pathname, STAFF_PREFIXES) && !isSystemAdmin(roles)) return true;
  if (matchesPrefix(pathname, PATIENT_PREFIXES)) return true;
  if (pathname === "/signup" || pathname.startsWith("/signup/")) return true;
  if (pathname === "/patient-login" || pathname.startsWith("/patient-login/")) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roles = getRolesFromCookie(request);

  const maintenance = await fetchMaintenanceStatus();
  if (maintenance && shouldRedirectToMaintenance(maintenance, pathname, roles)) {
    const url = new URL("/maintenance", request.url);
    if (maintenance.maintenanceMessage) {
      url.searchParams.set("msg", maintenance.maintenanceMessage.slice(0, 200));
    }
    return NextResponse.redirect(url);
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    const target = pathname.replace(/^\/portal/, "/patient") || "/patient";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === "/dashboard" || pathname.startsWith("/(app)")) {
    const home = roleHome(roles);
    if (home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  const isStaffArea = matchesPrefix(pathname, STAFF_PREFIXES);
  const isPatientArea = matchesPrefix(pathname, PATIENT_PREFIXES);

  if (isStaffArea || isPatientArea) {
    if (roles.length === 0) {
      const loginPath = isPatientArea ? "/patient-login" : "/login";
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    if (isPatientArea && !hasPatientRole(roles)) {
      const home = roleHome(roles) ?? "/login";
      return NextResponse.redirect(new URL(home, request.url));
    }

    if (isStaffArea && !hasStaffLoginRole(roles)) {
      return NextResponse.redirect(new URL("/patient-login", request.url));
    }

    if (isStaffArea && !canAccessStaffPath(roles, pathname)) {
      const home = roleHome(roles) ?? "/login";
      return NextResponse.redirect(new URL(home, request.url));
    }

    if (
      maintenance?.maintenanceMode &&
      maintenance.maintenanceScope === "full" &&
      !isSystemAdmin(roles) &&
      isStaffArea
    ) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }

    if (
      maintenance?.maintenanceMode &&
      maintenance.maintenanceScope === "patients" &&
      hasPatientRole(roles) &&
      isPatientArea
    ) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
