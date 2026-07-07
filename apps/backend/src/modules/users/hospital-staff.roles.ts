/**
 * @file hospital-staff.roles.ts
 * @path apps/backend/src/modules/users/hospital-staff.roles.ts
 * @description Kode backend modul users.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

export const HOSPITAL_ASSIGNABLE_ROLES = [
  "DOCTOR",
  "NURSE",
  "CASHIER",
  "PHARMACIST",
  "RADIOLOGIST",
  "LAB_ANALYST",
  "RECEPTIONIST"
] as const;

export const HOSPITAL_PROTECTED_ROLES = ["PATIENT", "HOSPITAL_ADMIN", "SYSTEM_ADMIN"] as const;

export type HospitalAssignableRole = (typeof HOSPITAL_ASSIGNABLE_ROLES)[number];

export function isHospitalAssignableRole(roleKey: string): boolean {
  return HOSPITAL_ASSIGNABLE_ROLES.includes(roleKey as HospitalAssignableRole);
}

export function filterHospitalAssignableRoles(roleKeys: string[]): string[] {
  return roleKeys.filter(isHospitalAssignableRole);
}

export function hasPatientRoleKey(roleKeys: string[]): boolean {
  return roleKeys.some((key) => key.toUpperCase() === "PATIENT");
}

export function shouldPreserveRolesForHospitalAdmin(targetRoleKeys: string[]): boolean {
  return targetRoleKeys.some((key) =>
    (HOSPITAL_PROTECTED_ROLES as readonly string[]).includes(key)
  );
}
