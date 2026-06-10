import { api } from "./api";

type ApiEnvelope<T> = { success?: boolean; data?: T };

export type OverviewStatStatus = "ok" | "warn" | "error" | "neutral";

export type OverviewStat = {
  label: string;
  value: string;
  description: string;
  status: OverviewStatStatus;
};

export type SystemOverview = {
  stats: OverviewStat[];
  generatedAt: string;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export async function getSystemAdminOverview(): Promise<SystemOverview> {
  const response = await api.get<ApiEnvelope<SystemOverview>>("/health/overview");
  return unwrapEnvelope(response.data);
}
