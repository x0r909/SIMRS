"use client";

import axios from "axios";

import { authStore } from "./auth-store";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1"]);

function parseApiPort(configured?: string): string {
  if (!configured) return "4000";
  try {
    return new URL(configured).port || "4000";
  } catch {
    return "4000";
  }
}

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const apiPort = parseApiPort(configured);

  if (typeof window !== "undefined") {
    const pageHost = window.location.hostname;
    let apiHost = "localhost";
    if (configured) {
      try {
        apiHost = new URL(configured).hostname;
      } catch {
        apiHost = "127.0.0.1";
      }
    }

    if (!LOCALHOST_HOSTS.has(pageHost) && LOCALHOST_HOSTS.has(apiHost)) {
      const protocol = window.location.protocol === "https:" ? "https" : "http";
      return `${protocol}://${pageHost}:${apiPort}/v1`;
    }
  }

  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000/v1";
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/v1`;
  }

  return "http://localhost:4000/v1";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30_000
});

api.interceptors.request.use((config) => {
  const token = authStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config;
    if (status === 401 && original && !original.__isRetry) {
      original.__isRetry = true;
      if (!refreshing) {
        refreshing = (async () => {
          const refreshToken = authStore.getRefreshToken();
          if (!refreshToken) return null;
          try {
            const resp = await axios.post(
              `${api.defaults.baseURL}/auth/refresh`,
              { refreshToken },
              { timeout: 30_000 }
            );
            const newAccess = resp.data?.data?.accessToken ?? resp.data?.accessToken;
            const newRefresh = resp.data?.data?.refreshToken ?? resp.data?.refreshToken;
            if (newAccess && newRefresh) {
              authStore.setTokens(newAccess, newRefresh);
            } else if (newAccess) {
              authStore.setAccessToken(newAccess);
            }
            return newAccess ?? null;
          } catch {
            authStore.clear();
            return null;
          } finally {
            refreshing = null;
          }
        })();
      }
      const newToken = await refreshing;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }

    if (status === 503 && typeof window !== "undefined") {
      const requestUrl = String(original?.url ?? "");
      const isSettingsRequest = requestUrl.includes("/system/settings");
      const code = (err?.response?.data as { error?: { code?: string } })?.error?.code;
      if (
        code === "MAINTENANCE_MODE" &&
        !isSettingsRequest &&
        !window.location.pathname.startsWith("/maintenance") &&
        !window.location.pathname.startsWith("/system-admin/settings")
      ) {
        window.location.href = "/maintenance";
        return new Promise(() => {});
      }
    }

    throw err;
  }
);

