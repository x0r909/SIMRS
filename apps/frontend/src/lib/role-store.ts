"use client";


/**
 * @file role-store.ts
 * @path apps/frontend/src/lib/role-store.ts
 * @description Penyimpanan role user di cookie untuk middleware Next.js.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

const ROLES_KEY = "simrs.roles";

export const roleStore = {
  setRoles(roles: string[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    document.cookie = `simrs_roles=${encodeURIComponent(roles.join(","))}; path=/; max-age=604800; SameSite=Lax`;
  },
  getRoles(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(ROLES_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ROLES_KEY);
    document.cookie = "simrs_roles=; path=/; max-age=0";
  }
};
