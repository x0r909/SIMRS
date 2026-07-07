/**
 * @file set-role-permissions.dto.ts
 * @path apps/backend/src/modules/roles/dto/set-role-permissions.dto.ts
 * @description DTO validasi request roles: set-role-permissions (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class SetRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionKeys!: string[];
}

