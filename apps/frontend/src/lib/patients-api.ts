/**
 * @file patients-api.ts
 * @path apps/frontend/src/lib/patients-api.ts
 * @description API client khusus modul pasien.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { api } from "./api";
import type { ApiEnvelope, Paginated, Patient } from "./types";

export async function listPatients(params: { page?: number; limit?: number; q?: string }) {
  const res = await api.get<ApiEnvelope<Patient[]>>("/patients", { params });
  const body: any = res.data;
  if (body?.success === false) throw new Error(body.error?.message ?? "Request failed");
  // our backend returns {success:true,data,meta}
  return { data: body.data as Patient[], meta: body.meta } as Paginated<Patient>;
}

export async function getPatient(id: string) {
  const res = await api.get<ApiEnvelope<Patient>>(`/patients/${id}`);
  const body: any = res.data;
  if (body?.success === false) throw new Error(body.error?.message ?? "Request failed");
  return (body.data ?? body) as Patient;
}

export async function createPatient(input: {
  mrn: string;
  name: string;
  phone?: string;
  address?: string;
  birthDate?: string;
}) {
  const res = await api.post<ApiEnvelope<Patient>>("/patients", input);
  const body: any = res.data;
  if (body?.success === false) throw new Error(body.error?.message ?? "Request failed");
  return (body.data ?? body) as Patient;
}

export async function updatePatient(
  id: string,
  input: Partial<{ mrn: string; name: string; phone?: string; address?: string; birthDate?: string }>
) {
  const res = await api.put<ApiEnvelope<Patient>>(`/patients/${id}`, input);
  const body: any = res.data;
  if (body?.success === false) throw new Error(body.error?.message ?? "Request failed");
  return (body.data ?? body) as Patient;
}

export async function deletePatient(id: string) {
  const res = await api.delete<ApiEnvelope<{ id: string }>>(`/patients/${id}`);
  const body: any = res.data;
  if (body?.success === false) throw new Error(body.error?.message ?? "Request failed");
  return body.data ?? body;
}

