/**
 * @file create-radiology-result.dto.ts
 * @path apps/backend/src/modules/radiology/dto/create-radiology-result.dto.ts
 * @description DTO validasi request radiology: create-radiology-result (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateRadiologyResultDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  impression?: string;

  @IsOptional()
  @IsString()
  filePath?: string;
}
