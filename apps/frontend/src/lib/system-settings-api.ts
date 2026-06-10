import { api } from "./api";

type ApiEnvelope<T> = { success?: boolean; data?: T };

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

export type MaintenanceScope = "registration" | "patients" | "full";

export type OperationalSettings = {
  maintenanceMode: boolean;
  maintenanceScope: MaintenanceScope;
  maintenanceMessage: string;
  maintenanceEndsAt: string | null;
  allowPatientRegistration: boolean;
  backupRetentionDays: number;
  timezone: string;
  locale: string;
  operatingHoursOpen: string;
  operatingHoursClose: string;
};

export type RuntimeInfo = {
  nodeEnv: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  maxConcurrentSessions: number;
  logLevel: string;
  prometheusEnabled: boolean;
};

export type SystemSettings = {
  hospital: HospitalProfile;
  operational: OperationalSettings;
  runtime: RuntimeInfo;
};

export type UpdateSystemSettingsInput = {
  profile?: Partial<Pick<HospitalProfile, "name" | "address" | "phone" | "email" | "logoUrl">>;
  operational?: Partial<OperationalSettings>;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await api.get<ApiEnvelope<SystemSettings>>("/system/settings");
  return unwrapEnvelope(response.data);
}

export async function updateSystemSettings(input: UpdateSystemSettingsInput): Promise<SystemSettings> {
  const response = await api.patch<ApiEnvelope<SystemSettings>>("/system/settings", input);
  return unwrapEnvelope(response.data);
}

export type UpdateMaintenanceInput = {
  enabled: boolean;
  scope?: MaintenanceScope;
  message?: string;
  endsAt?: string | null;
};

export async function updateMaintenanceMode(
  input: UpdateMaintenanceInput
): Promise<SystemSettings> {
  const response = await api.patch<ApiEnvelope<SystemSettings>>(
    "/system/settings/maintenance",
    input
  );
  return unwrapEnvelope(response.data);
}

export async function getPublicSystemSettings(): Promise<{
  maintenanceMode: boolean;
  maintenanceScope: MaintenanceScope;
  maintenanceMessage: string;
  maintenanceEndsAt: string | null;
  allowPatientRegistration: boolean;
  hospitalName: string;
}> {
  const response = await api.get("/system/settings/public");
  return unwrapEnvelope(response.data);
}
