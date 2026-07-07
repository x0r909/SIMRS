/**
 * @file types.ts
 * @path apps/backend/src/modules/auth/types.ts
 * @description Definisi tipe TypeScript modul auth.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  hospitalId?: string | null;
  departmentId?: string | null;
  jti?: string;
};
