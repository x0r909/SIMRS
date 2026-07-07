/**
 * @file create-queue-entry.dto.ts
 * @path apps/backend/src/modules/queues/dto/create-queue-entry.dto.ts
 * @description DTO validasi request queues: create-queue-entry (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateQueueEntryDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsDateString()
  date!: string;
}

