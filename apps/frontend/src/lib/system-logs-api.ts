/**
 * @file system-logs-api.ts
 * @path apps/frontend/src/lib/system-logs-api.ts
 * @description API client system log.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { api } from "./api";

type ApiEnvelope<T> = { success?: boolean; data?: T };

export type SystemLogMetadata = {
  method?: string;
  path?: string;
  originalUrl?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  userAgent?: string;
  referer?: string;
  host?: string;
  protocol?: string;
  userEmail?: string;
  userRoles?: string[];
  authenticated?: boolean;
  error?: string;
  event?: string;
  port?: number;
  env?: string;
  nodeVersion?: string;
  pid?: number;
  [key: string]: unknown;
};

export type SystemLogActor = {
  id: string;
  email: string;
  name: string;
  roles: Array<{ role: { key: string; name: string } }>;
};

export type SystemLogEntry = {
  id: string;
  level: string;
  service: string;
  context?: string | null;
  message: string;
  metadata?: SystemLogMetadata | null;
  requestId?: string | null;
  traceId?: string | null;
  ipAddress?: string | null;
  userId?: string | null;
  duration?: number | null;
  statusCode?: number | null;
  createdAt: string;
  actor?: SystemLogActor | null;
};

export type SystemLogsResponse = {
  data: SystemLogEntry[];
  meta: { page: number; limit: number; total: number };
};

export type SystemLogStats = {
  errors: number;
  warnings: number;
  total: number;
  period: string;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export async function listSystemLogs(params?: {
  page?: number;
  limit?: number;
  level?: string;
  service?: string;
}): Promise<SystemLogsResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const response = await api.get<ApiEnvelope<SystemLogsResponse>>("/system-logs", {
    params: { page, limit, level: params?.level, service: params?.service }
  });
  const body = unwrapEnvelope(response.data);
  return {
    data: body?.data ?? [],
    meta: body?.meta ?? { page, limit, total: 0 }
  };
}

export async function getSystemLogStats(): Promise<SystemLogStats> {
  const response = await api.get<ApiEnvelope<SystemLogStats>>("/system-logs/stats");
  return unwrapEnvelope(response.data);
}
