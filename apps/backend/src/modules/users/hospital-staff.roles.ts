export const HOSPITAL_ASSIGNABLE_ROLES = [
  "DOCTOR",
  "NURSE",
  "CASHIER",
  "PHARMACIST",
  "RADIOLOGIST",
  "LAB_ANALYST",
  "RECEPTIONIST"
] as const;

export type HospitalAssignableRole = (typeof HOSPITAL_ASSIGNABLE_ROLES)[number];

export function isHospitalAssignableRole(roleKey: string): boolean {
  return HOSPITAL_ASSIGNABLE_ROLES.includes(roleKey as HospitalAssignableRole);
}

export function filterHospitalAssignableRoles(roleKeys: string[]): string[] {
  return roleKeys.filter(isHospitalAssignableRole);
}
