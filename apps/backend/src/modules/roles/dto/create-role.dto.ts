/**
 * @file create-role.dto.ts
 * @path apps/backend/src/modules/roles/dto/create-role.dto.ts
 * @description DTO validasi request roles: create-role (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateRoleDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsOptional()
  description?: string;
}

