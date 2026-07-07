/**
 * @file login.dto.ts
 * @path apps/backend/src/modules/auth/dto/login.dto.ts
 * @description DTO validasi request auth: login (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

