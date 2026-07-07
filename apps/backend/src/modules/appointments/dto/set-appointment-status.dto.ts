/**
 * @file set-appointment-status.dto.ts
 * @path apps/backend/src/modules/appointments/dto/set-appointment-status.dto.ts
 * @description DTO validasi request appointments: set-appointment-status (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsIn } from "class-validator";

export class SetAppointmentStatusDto {
  @IsIn(["SCHEDULED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status!: "SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

