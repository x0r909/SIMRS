/**
 * @file update-profile.dto.ts
 * @path apps/backend/src/modules/auth/dto/update-profile.dto.ts
 * @description DTO validasi request auth: update-profile (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ValidateIf((dto: UpdateProfileDto) => Boolean(dto.password))
  @IsString()
  @MinLength(1)
  currentPassword?: string;
}
