import { api } from "./api";

type ApiEnvelope<T> = { success?: boolean; data?: T };

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  permissions: string[];
  hospitalId?: string | null;
  departmentId?: string | null;
  hospital?: { id: string; code: string; name: string } | null;
  department?: { id: string; code: string; name: string } | null;
  avatarUrl?: string | null;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
};

export type UpdateProfileInput = {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
};

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export async function getMyProfile(): Promise<UserProfile> {
  const response = await api.get<ApiEnvelope<UserProfile>>("/auth/me");
  return unwrap(response.data);
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await api.patch<ApiEnvelope<UserProfile>>("/auth/profile", input);
  return unwrap(response.data);
}

export const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "Admin Sistem",
  HOSPITAL_ADMIN: "Admin Rumah Sakit",
  DOCTOR: "Dokter",
  NURSE: "Perawat",
  CASHIER: "Kasir",
  PHARMACIST: "Apoteker",
  RADIOLOGIST: "Radiologi",
  LAB_ANALYST: "Analis Lab",
  RECEPTIONIST: "Resepsionis",
  PATIENT: "Pasien"
};
