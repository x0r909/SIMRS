/**
 * @file create-doctor.dto.ts
 * @path apps/backend/src/modules/doctors/dto/create-doctor.dto.ts
 * @description DTO validasi request doctors: create-doctor (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateDoctorDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

