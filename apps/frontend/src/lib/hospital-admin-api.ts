import { api } from "./api";
import type { DashboardStat } from "@/components/dashboard-overview";

type ApiEnvelope<T> = { success?: boolean; data?: T };

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export type HospitalOverview = {
  stats: DashboardStat[];
  hospitalName: string;
  generatedAt: string;
};

export type HospitalProfile = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  status: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  hospitalId: string;
};

export type AssignableRole = { key: string; name: string };

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  hospitalId?: string | null;
  departmentId?: string | null;
  roles: Array<{ id: string; key: string; name: string }>;
  createdAt: string;
};

export type DailyReport = {
  date: string;
  hospitalId: string;
  summary: {
    visits: number;
    appointments: number;
    queueCompleted: number;
    revenue: number;
    revenueFormatted: string;
  };
  visitsByStatus: Array<{ status: string; count: number }>;
  topDiagnoses: Array<{ diagnosis: string; count: number }>;
  generatedAt: string;
};

export async function getHospitalOverview(): Promise<HospitalOverview> {
  const response = await api.get<ApiEnvelope<HospitalOverview>>("/health/hospital-overview");
  return unwrap(response.data);
}

export async function getHospitalDefault(): Promise<HospitalProfile> {
  const response = await api.get<ApiEnvelope<HospitalProfile>>("/hospitals/default");
  return unwrap(response.data);
}

export async function updateHospital(
  id: string,
  input: Partial<Pick<HospitalProfile, "name" | "address" | "phone" | "email" | "logoUrl">>
): Promise<HospitalProfile> {
  const response = await api.patch<ApiEnvelope<HospitalProfile>>(`/hospitals/${id}`, input);
  return unwrap(response.data);
}

export async function listDepartments(): Promise<Department[]> {
  const response = await api.get<ApiEnvelope<Department[]>>("/departments");
  return unwrap(response.data);
}

export async function createDepartment(input: {
  name: string;
  code: string;
  description?: string;
}): Promise<Department> {
  const response = await api.post<ApiEnvelope<Department>>("/departments", input);
  return unwrap(response.data);
}

export async function updateDepartment(
  id: string,
  input: { name?: string; description?: string }
): Promise<Department> {
  const response = await api.patch<ApiEnvelope<Department>>(`/departments/${id}`, input);
  return unwrap(response.data);
}

export async function listHospitalStaff(): Promise<StaffUser[]> {
  const response = await api.get<ApiEnvelope<StaffUser[]>>("/users");
  return unwrap(response.data);
}

export async function listAssignableStaffRoles(): Promise<AssignableRole[]> {
  const response = await api.get<ApiEnvelope<AssignableRole[]>>("/users/assignable-roles");
  return unwrap(response.data);
}

export async function createHospitalStaff(input: {
  email: string;
  name: string;
  password: string;
  roleKeys: string[];
  departmentId?: string;
}): Promise<StaffUser> {
  const response = await api.post<ApiEnvelope<StaffUser>>("/users", input);
  return unwrap(response.data);
}

export async function updateHospitalStaff(
  id: string,
  input: {
    email?: string;
    name?: string;
    password?: string;
    status?: "ACTIVE" | "DISABLED";
    roleKeys?: string[];
    departmentId?: string | null;
  }
): Promise<StaffUser> {
  const response = await api.put<ApiEnvelope<StaffUser>>(`/users/${id}`, input);
  return unwrap(response.data);
}

export async function getDailyReport(date?: string): Promise<DailyReport> {
  const response = await api.get<ApiEnvelope<DailyReport>>("/reports/daily", {
    params: date ? { date } : undefined
  });
  return unwrap(response.data);
}
