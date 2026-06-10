export const ROLE_PATIENT = "PATIENT";

/** Role yang boleh masuk lewat portal staff (bukan pasien). */
export const STAFF_LOGIN_ROLES = new Set([
  "SYSTEM_ADMIN",
  "HOSPITAL_ADMIN",
  "DOCTOR",
  "NURSE",
  "CASHIER",
  "PHARMACIST",
  "RADIOLOGIST",
  "LAB_ANALYST",
  "RECEPTIONIST",
  // legacy v1
  "admin",
  "doctor",
  "staff",
  "pharmacy",
  "radiology",
  "lab",
  "cashier"
]);

export type LoginAudience = "staff" | "patient";

export function normalizeRoleKey(role: string): string {
  return role.trim().toUpperCase();
}

export function hasPatientRole(roles: string[]): boolean {
  return roles.some((role) => normalizeRoleKey(role) === ROLE_PATIENT);
}

export function hasStaffLoginRole(roles: string[]): boolean {
  return roles.some((role) => STAFF_LOGIN_ROLES.has(role) || STAFF_LOGIN_ROLES.has(normalizeRoleKey(role)));
}

export function assertLoginAudience(roles: string[], audience: LoginAudience): void {
  if (audience === "patient") {
    if (!hasPatientRole(roles)) {
      throw new Error("PATIENT_LOGIN_REQUIRED");
    }
    return;
  }

  if (!hasStaffLoginRole(roles)) {
    throw new Error("STAFF_LOGIN_REQUIRED");
  }
}
