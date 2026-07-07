/**
 * @file create-laboratory-result.dto.ts
 * @path apps/backend/src/modules/laboratory/dto/create-laboratory-result.dto.ts
 * @description DTO validasi request laboratory: create-laboratory-result (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateLaboratoryResultDto {
  @IsString()
  parameter!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  normalRange?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
