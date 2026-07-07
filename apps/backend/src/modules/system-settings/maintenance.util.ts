/**
 * @file maintenance.util.ts
 * @path apps/backend/src/modules/system-settings/maintenance.util.ts
 * @description Fungsi utilitas modul system-settings.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

export type MaintenanceScope = "registration" | "patients" | "full";

export const MAINTENANCE_SCOPES: MaintenanceScope[] = ["registration", "patients", "full"];

export function isSystemAdminRole(roles: string[]): boolean {
  return roles.some((role) => role === "SYSTEM_ADMIN" || role === "admin");
}

export function isPatientRole(roles: string[]): boolean {
  return roles.some((role) => role.toUpperCase() === "PATIENT" || role === "patient");
}

export function canBypassMaintenance(
  scope: MaintenanceScope,
  roles: string[],
  options?: { isLoginRoute?: boolean; isRegisterRoute?: boolean }
): boolean {
  if (isSystemAdminRole(roles)) return true;

  if (scope === "registration") {
    return !options?.isRegisterRoute;
  }

  if (scope === "patients") {
    return !isPatientRole(roles);
  }

  // full — hanya system admin
  return false;
}
