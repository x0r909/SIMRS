import axios from "axios";

import { api } from "@/lib/api";
import type {
  ApiEnvelope,
  Appointment,
  AppointmentStatus,
  AuthUser,
  BillingInvoice,
  DailyOrderSummary,
  Doctor,
  FileObject,
  LaboratoryOrder,
  LoginResult,
  Medicine,
  PatientRegistrationResult,
  Paginated,
  Patient,
  Permission,
  QueueEntry,
  QueueStatus,
  RadiologyOrder,
  Role,
  User,
  Visit
} from "@/lib/types";

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  if (payload && typeof payload === "object" && "success" in payload && payload.success === true) {
    return payload.data;
  }

  return payload as T;
}

function unwrapPaginated<T>(payload: ApiEnvelope<T[]> | { data: T[]; meta?: Paginated<T>["meta"] }) {
  const body = payload as ApiEnvelope<T[]>;
  const data = unwrap<T[]>(body);
  const meta =
    payload &&
    typeof payload === "object" &&
    "meta" in payload &&
    payload.meta &&
    typeof payload.meta === "object"
      ? (payload.meta as Paginated<T>["meta"])
      : { page: 1, limit: data.length, total: data.length };

  return { data, meta } as Paginated<T>;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { error?: { message?: string } })?.error?.message ??
      error.response?.statusText ??
      error.message;
    return message;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export async function login(input: { email: string; password: string }) {
  const response = await api.post<ApiEnvelope<LoginResult>>("/auth/login", input);
  return unwrap<LoginResult>(response.data);
}

export async function registerPatient(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  birthDate?: string;
}) {
  const response = await api.post<ApiEnvelope<PatientRegistrationResult>>("/auth/register-patient", input);
  return unwrap<PatientRegistrationResult>(response.data);
}

export async function fetchMe() {
  const response = await api.get<ApiEnvelope<AuthUser>>("/auth/me");
  return unwrap<AuthUser>(response.data);
}

export async function listPatients(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Patient[]>>("/patients", { params });
  return unwrapPaginated<Patient>(response.data as ApiEnvelope<Patient[]>);
}

export async function getPatient(id: string) {
  const response = await api.get<ApiEnvelope<Patient>>(`/patients/${id}`);
  return unwrap<Patient>(response.data);
}

export async function createPatient(input: {
  mrn: string;
  name: string;
  phone?: string;
  address?: string;
  birthDate?: string;
}) {
  const response = await api.post<ApiEnvelope<Patient>>("/patients", input);
  return unwrap<Patient>(response.data);
}

export async function updatePatient(
  id: string,
  input: Partial<{ mrn: string; name: string; phone?: string; address?: string; birthDate?: string }>
) {
  const response = await api.put<ApiEnvelope<Patient>>(`/patients/${id}`, input);
  return unwrap<Patient>(response.data);
}

export async function deletePatient(id: string) {
  const response = await api.delete<ApiEnvelope<{ id: string }>>(`/patients/${id}`);
  return unwrap<{ id: string }>(response.data);
}

export async function listDoctors(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Doctor[]>>("/doctors", { params });
  return unwrapPaginated<Doctor>(response.data as ApiEnvelope<Doctor[]>);
}

export async function createDoctor(input: {
  code: string;
  name: string;
  specialty?: string;
  phone?: string;
}) {
  const response = await api.post<ApiEnvelope<Doctor>>("/doctors", input);
  return unwrap<Doctor>(response.data);
}

export async function deleteDoctor(id: string) {
  const response = await api.delete<ApiEnvelope<{ id: string }>>(`/doctors/${id}`);
  return unwrap<{ id: string }>(response.data);
}

export async function listAppointments(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Appointment[]>>("/appointments", { params });
  return unwrapPaginated<Appointment>(response.data as ApiEnvelope<Appointment[]>);
}

export async function listMyAppointments(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Appointment[]>>("/appointments/me", { params });
  return unwrapPaginated<Appointment>(response.data as ApiEnvelope<Appointment[]>);
}

export async function createAppointment(input: {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  notes?: string;
}) {
  const response = await api.post<ApiEnvelope<Appointment>>("/appointments", input);
  return unwrap<Appointment>(response.data);
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  const response = await api.put<ApiEnvelope<Appointment>>(`/appointments/${id}/status`, { status });
  return unwrap<Appointment>(response.data);
}

export async function listQueues(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<QueueEntry[]>>("/queues", { params });
  return unwrapPaginated<QueueEntry>(response.data as ApiEnvelope<QueueEntry[]>);
}

export async function queueDashboard(date?: string) {
  const response = await api.get<ApiEnvelope<QueueEntry[]>>("/queues/dashboard", {
    params: date ? { date } : undefined
  });
  return unwrap<QueueEntry[]>(response.data);
}

export async function createQueueEntry(input: {
  patientId: string;
  doctorId?: string;
  date: string;
}) {
  const response = await api.post<ApiEnvelope<QueueEntry>>("/queues", input);
  return unwrap<QueueEntry>(response.data);
}

export async function setQueueStatus(id: string, status: QueueStatus) {
  const response = await api.put<ApiEnvelope<QueueEntry>>(`/queues/${id}/status`, { status });
  return unwrap<QueueEntry>(response.data);
}

export async function listMedicines(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Medicine[]>>("/medicines", { params });
  return unwrapPaginated<Medicine>(response.data as ApiEnvelope<Medicine[]>);
}

export async function createMedicine(input: {
  sku: string;
  name: string;
  unit?: string;
  stock: number;
  price: number;
}) {
  const response = await api.post<ApiEnvelope<Medicine>>("/medicines", input);
  return unwrap<Medicine>(response.data);
}

export async function deleteMedicine(id: string) {
  const response = await api.delete<ApiEnvelope<{ id: string }>>(`/medicines/${id}`);
  return unwrap<{ id: string }>(response.data);
}

export async function listVisits(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Visit[]>>("/visits", { params });
  return unwrapPaginated<Visit>(response.data as ApiEnvelope<Visit[]>);
}

export async function listMyVisits(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<Visit[]>>("/visits/me", { params });
  return unwrapPaginated<Visit>(response.data as ApiEnvelope<Visit[]>);
}

export async function listBilling(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<BillingInvoice[]>>("/billing", { params });
  return unwrapPaginated<BillingInvoice>(response.data as ApiEnvelope<BillingInvoice[]>);
}

export async function listMyBilling(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<BillingInvoice[]>>("/billing/me", { params });
  return unwrapPaginated<BillingInvoice>(response.data as ApiEnvelope<BillingInvoice[]>);
}

export async function listLaboratoryOrders(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<LaboratoryOrder[]>>("/laboratory/orders", { params });
  return unwrapPaginated<LaboratoryOrder>(response.data as ApiEnvelope<LaboratoryOrder[]>);
}

export async function laboratoryDailySummary(date?: string) {
  const response = await api.get<ApiEnvelope<DailyOrderSummary>>("/laboratory/orders/dashboard/summary", {
    params: date ? { date } : undefined
  });
  return unwrap<DailyOrderSummary>(response.data);
}

export async function createLaboratoryOrder(input: {
  visitId: string;
  doctorId: string;
  testType: string;
  notes?: string;
}) {
  const response = await api.post<ApiEnvelope<LaboratoryOrder>>("/laboratory/orders", input);
  return unwrap<LaboratoryOrder>(response.data);
}

export async function setLaboratoryOrderStatus(
  id: string,
  status: "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL"
) {
  const response = await api.put<ApiEnvelope<LaboratoryOrder>>(`/laboratory/orders/${id}/status`, {
    status
  });
  return unwrap<LaboratoryOrder>(response.data);
}

export async function addLaboratoryResult(
  id: string,
  input: {
    parameter: string;
    value: string;
    unit?: string;
    normalRange?: string;
    notes?: string;
  }
) {
  const response = await api.post<ApiEnvelope<LaboratoryOrder>>(`/laboratory/orders/${id}/results`, input);
  return unwrap<LaboratoryOrder>(response.data);
}

export async function listRadiologyOrders(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<RadiologyOrder[]>>("/radiology/orders", { params });
  return unwrapPaginated<RadiologyOrder>(response.data as ApiEnvelope<RadiologyOrder[]>);
}

export async function radiologyDailySummary(date?: string) {
  const response = await api.get<ApiEnvelope<DailyOrderSummary>>("/radiology/orders/dashboard/summary", {
    params: date ? { date } : undefined
  });
  return unwrap<DailyOrderSummary>(response.data);
}

export async function createRadiologyOrder(input: {
  visitId: string;
  doctorId: string;
  examType: string;
  notes?: string;
}) {
  const response = await api.post<ApiEnvelope<RadiologyOrder>>("/radiology/orders", input);
  return unwrap<RadiologyOrder>(response.data);
}

export async function setRadiologyOrderStatus(
  id: string,
  status: "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL"
) {
  const response = await api.put<ApiEnvelope<RadiologyOrder>>(`/radiology/orders/${id}/status`, {
    status
  });
  return unwrap<RadiologyOrder>(response.data);
}

export async function addRadiologyResult(
  id: string,
  input: {
    description: string;
    impression?: string;
    filePath?: string;
  }
) {
  const response = await api.post<ApiEnvelope<RadiologyOrder>>(`/radiology/orders/${id}/results`, input);
  return unwrap<RadiologyOrder>(response.data);
}

export async function createInvoice(input: {
  visitId: string;
  items?: Array<{ name: string; qty: number; price: number }>;
}) {
  const response = await api.post<ApiEnvelope<BillingInvoice>>("/billing/invoices", input);
  return unwrap<BillingInvoice>(response.data);
}

export async function markInvoicePaid(id: string) {
  const response = await api.put<ApiEnvelope<BillingInvoice>>(`/billing/invoices/${id}/paid`);
  return unwrap<BillingInvoice>(response.data);
}

export async function listUsers() {
  const response = await api.get<ApiEnvelope<User[]>>("/users");
  return unwrap<User[]>(response.data);
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  roleKeys?: string[];
}) {
  const response = await api.post<ApiEnvelope<User>>("/users", input);
  return unwrap<User>(response.data);
}

export async function listRoles() {
  const response = await api.get<ApiEnvelope<Role[]>>("/roles");
  return unwrap<Role[]>(response.data);
}

export async function createRole(input: { key: string; name: string; description?: string }) {
  const response = await api.post<ApiEnvelope<Role>>("/roles", input);
  return unwrap<Role>(response.data);
}

export async function setRolePermissions(roleId: string, permissionKeys: string[]) {
  const response = await api.put<ApiEnvelope<Role>>(`/roles/${roleId}/permissions`, {
    permissionKeys
  });
  return unwrap<Role>(response.data);
}

export async function listPermissions() {
  const response = await api.get<ApiEnvelope<Permission[]>>("/permissions");
  return unwrap<Permission[]>(response.data);
}

export async function listFiles(params?: { page?: number; limit?: number; q?: string }) {
  const response = await api.get<ApiEnvelope<FileObject[]>>("/files", { params });
  return unwrapPaginated<FileObject>(response.data as ApiEnvelope<FileObject[]>);
}

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post<ApiEnvelope<FileObject>>("/files/upload", form, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return unwrap<FileObject>(response.data);
}

export async function downloadFile(id: string) {
  const response = await api.get<Blob>(`/files/${id}/download`, {
    responseType: "blob"
  });
  return response.data;
}
