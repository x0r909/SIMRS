/**
 * @file appointments.module.ts
 * @path apps/backend/src/modules/appointments/appointments.module.ts
 * @description Modul NestJS appointments: wiring dependency injection. Janji temu: penjadwalan, status lifecycle, booking pasien mandiri.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}

