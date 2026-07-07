/**
 * @file health-api.ts
 * @path apps/frontend/src/lib/health-api.ts
 * @description API client health check infrastruktur.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import axios from "axios";

import { api } from "./api";

export type HealthIndicatorStatus = {
  status: "up" | "down";
  [key: string]: unknown;
};

export type DetailedHealthResponse = {
  status?: "ok" | "error";
  info?: Record<string, HealthIndicatorStatus>;
  details?: Record<string, HealthIndicatorStatus>;
  error?: Record<string, HealthIndicatorStatus>;
};

function unwrapHealth(payload: unknown): DetailedHealthResponse {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: DetailedHealthResponse }).data;
  }
  return payload as DetailedHealthResponse;
}

export async function getDetailedHealth(): Promise<DetailedHealthResponse> {
  try {
    const response = await api.get("/health/detailed");
    return unwrapHealth(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const partial = unwrapHealth(error.response.data);
      if (partial.details || partial.info || partial.error) {
        return partial;
      }
    }
    throw error;
  }
}

export function mergeHealthIndicators(
  data: DetailedHealthResponse
): Record<string, HealthIndicatorStatus> {
  return {
    ...(data.info ?? {}),
    ...(data.details ?? {}),
    ...(data.error ?? {})
  };
}

export function isServiceUp(status: HealthIndicatorStatus | undefined): boolean {
  return status?.status === "up";
}
