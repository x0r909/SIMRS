/**
 * @file update-appointment.dto.ts
 * @path apps/backend/src/modules/appointments/dto/update-appointment.dto.ts
 * @description DTO validasi request appointments: update-appointment (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PartialType } from "@nestjs/swagger";

import { CreateAppointmentDto } from "./create-appointment.dto";

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

