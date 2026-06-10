import { hasPatientRole, hasStaffLoginRole } from "@/lib/role-utils";

const STAFF_ROLES = [
  "NURSE",
  "CASHIER",
  "PHARMACIST",
  "RADIOLOGIST",
  "LAB_ANALYST",
  "RECEPTIONIST"
] as const;

const ROLE_DASHBOARD: Record<string, string> = {
  SYSTEM_ADMIN: "/system-admin",
  HOSPITAL_ADMIN: "/hospital-admin",
  DOCTOR: "/doctor",
  NURSE: "/staff",
  CASHIER: "/staff",
  PHARMACIST: "/staff",
  RADIOLOGIST: "/staff",
  LAB_ANALYST: "/staff",
  RECEPTIONIST: "/staff",
  PATIENT: "/patient",
  // legacy v1 keys
  admin: "/system-admin",
  doctor: "/doctor",
  staff: "/staff",
  pharmacy: "/staff",
  radiology: "/staff",
  lab: "/staff",
  cashier: "/staff",
  patient: "/patient"
};

export function resolveDashboardPath(roles: string[]): string {
  const priority = [
    "SYSTEM_ADMIN",
    "admin",
    "HOSPITAL_ADMIN",
    "DOCTOR",
    "doctor",
    ...STAFF_ROLES,
    "staff",
    "pharmacy",
    "radiology",
    "lab",
    "cashier",
    "PATIENT",
    "patient"
  ];

  for (const role of priority) {
    if (roles.includes(role) && ROLE_DASHBOARD[role]) {
      return ROLE_DASHBOARD[role];
    }
  }
  return "/login";
}

export function isStaffRole(roles: string[]): boolean {
  return roles.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number]) || r === "staff");
}

function isSystemAdmin(roles: string[]): boolean {
  return roles.includes("SYSTEM_ADMIN") || roles.includes("admin");
}

export function canAccessPath(roles: string[], pathname: string): boolean {
  if (pathname.startsWith("/patient") || pathname.startsWith("/portal")) {
    return hasPatientRole(roles);
  }

  if (isSystemAdmin(roles)) {
    return true;
  }

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
    return isStaffRole(roles) || hasStaffLoginRole(roles);
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/(app)")) {
    return hasStaffLoginRole(roles);
  }

  return true;
}

export function resolveLoginPath(roles: string[]): string {
  if (hasPatientRole(roles) && !hasStaffLoginRole(roles)) {
    return "/patient-login";
  }
  return "/login";
}
