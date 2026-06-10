"use client";

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
