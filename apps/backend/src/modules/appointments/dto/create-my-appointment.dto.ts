/**
 * @file create-my-appointment.dto.ts
 * @path apps/backend/src/modules/appointments/dto/create-my-appointment.dto.ts
 * @description DTO validasi request appointments: create-my-appointment (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateMyAppointmentDto {
  @IsString()
  doctorId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
