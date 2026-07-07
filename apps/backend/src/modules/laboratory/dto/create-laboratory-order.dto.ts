/**
 * @file create-laboratory-order.dto.ts
 * @path apps/backend/src/modules/laboratory/dto/create-laboratory-order.dto.ts
 * @description DTO validasi request laboratory: create-laboratory-order (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateLaboratoryOrderDto {
  @IsString()
  visitId!: string;

  @IsString()
  doctorId!: string;

  @IsString()
  testType!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
