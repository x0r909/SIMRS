/**
 * @file auth-session.ts
 * @path apps/frontend/src/lib/auth-session.ts
 * @description Helper sesi: establish/clear auth + invalidate React Query cache.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import type { QueryClient } from "@tanstack/react-query";

import { authStore } from "@/lib/auth-store";
import { roleStore } from "@/lib/role-store";

export function clearAuthSession(queryClient?: QueryClient) {
  authStore.clear();
  roleStore.clear();
  queryClient?.removeQueries({ queryKey: ["auth-me"] });
  queryClient?.removeQueries({ queryKey: ["my-profile"] });
}

export function establishAuthSession(
  accessToken: string,
  refreshToken: string,
  roles: string[],
  queryClient?: QueryClient
) {
  queryClient?.removeQueries({ queryKey: ["auth-me"] });
  queryClient?.removeQueries({ queryKey: ["my-profile"] });
  authStore.setTokens(accessToken, refreshToken);
  roleStore.setRoles(roles);
}
