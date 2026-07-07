/**
 * @file create-radiology-order.dto.ts
 * @path apps/backend/src/modules/radiology/dto/create-radiology-order.dto.ts
 * @description DTO validasi request radiology: create-radiology-order (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateRadiologyOrderDto {
  @IsString()
  visitId!: string;

  @IsString()
  doctorId!: string;

  @IsString()
  examType!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
