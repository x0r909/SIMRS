const ROLE_PATIENT = "PATIENT";

const STAFF_LOGIN_ROLES = new Set([
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

export function normalizeRoleKey(role: string): string {
  return role.trim().toUpperCase();
}

export function hasPatientRole(roles: string[]): boolean {
  return roles.some((role) => normalizeRoleKey(role) === ROLE_PATIENT);
}

export function hasStaffLoginRole(roles: string[]): boolean {
  return roles.some(
    (role) => STAFF_LOGIN_ROLES.has(role) || STAFF_LOGIN_ROLES.has(normalizeRoleKey(role))
  );
}

export function isPatientOnlyUser(roles: string[]): boolean {
  return hasPatientRole(roles) && !hasStaffLoginRole(roles);
}
