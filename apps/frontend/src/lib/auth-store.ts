"use client";


/**
 * @file auth-store.ts
 * @path apps/frontend/src/lib/auth-store.ts
 * @description Penyimpanan token JWT access/refresh di localStorage.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

const ACCESS = "simrs.access";
const REFRESH = "simrs.refresh";

export const authStore = {
  getAccessToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS);
  },
  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH);
  },
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS, accessToken);
    window.localStorage.setItem(REFRESH, refreshToken);
  },
  setAccessToken(accessToken: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS, accessToken);
  },
  isAuthenticated() {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(ACCESS));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS);
    window.localStorage.removeItem(REFRESH);
  }
};

