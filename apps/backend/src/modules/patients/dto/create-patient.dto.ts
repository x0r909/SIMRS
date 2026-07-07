/**
 * @file create-patient.dto.ts
 * @path apps/backend/src/modules/patients/dto/create-patient.dto.ts
 * @description DTO validasi request patients: create-patient (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreatePatientDto {
  @IsString()
  mrn!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

