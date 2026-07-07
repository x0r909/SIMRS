/**
 * @file roles.ts
 * @path packages/shared/src/constants/roles.ts
 * @description Konstanta role key yang dibagikan frontend/backend.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

export const ROLE_KEYS = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  HOSPITAL_ADMIN: "HOSPITAL_ADMIN",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  CASHIER: "CASHIER",
  PHARMACIST: "PHARMACIST",
  RADIOLOGIST: "RADIOLOGIST",
  LAB_ANALYST: "LAB_ANALYST",
  RECEPTIONIST: "RECEPTIONIST",
  PATIENT: "PATIENT"
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export const STAFF_ROLE_KEYS = [
  ROLE_KEYS.NURSE,
  ROLE_KEYS.CASHIER,
  ROLE_KEYS.PHARMACIST,
  ROLE_KEYS.RADIOLOGIST,
  ROLE_KEYS.LAB_ANALYST,
  ROLE_KEYS.RECEPTIONIST
] as const;

export const DASHBOARD_ROUTES: Record<string, string> = {
  [ROLE_KEYS.SYSTEM_ADMIN]: "/system-admin",
  [ROLE_KEYS.HOSPITAL_ADMIN]: "/hospital-admin",
  [ROLE_KEYS.DOCTOR]: "/doctor",
  [ROLE_KEYS.NURSE]: "/staff",
  [ROLE_KEYS.CASHIER]: "/staff",
  [ROLE_KEYS.PHARMACIST]: "/staff",
  [ROLE_KEYS.RADIOLOGIST]: "/staff",
  [ROLE_KEYS.LAB_ANALYST]: "/staff",
  [ROLE_KEYS.RECEPTIONIST]: "/staff",
  [ROLE_KEYS.PATIENT]: "/patient"
};
