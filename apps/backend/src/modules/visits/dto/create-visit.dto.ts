/**
 * @file create-visit.dto.ts
 * @path apps/backend/src/modules/visits/dto/create-visit.dto.ts
 * @description DTO validasi request visits: create-visit (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class CreateVisitDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  complaint?: string;
}

