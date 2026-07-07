/**
 * @file permissions.decorator.ts
 * @path apps/backend/src/common/auth/permissions.decorator.ts
 * @description Decorator @RequirePermissions untuk endpoint RBAC.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

