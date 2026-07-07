/**
 * @file create-appointment.dto.ts
 * @path apps/backend/src/modules/appointments/dto/create-appointment.dto.ts
 * @description DTO validasi request appointments: create-appointment (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

