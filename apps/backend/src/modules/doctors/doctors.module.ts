/**
 * @file doctors.module.ts
 * @path apps/backend/src/modules/doctors/doctors.module.ts
 * @description Modul NestJS doctors: wiring dependency injection. Data dokter: spesialisasi, jadwal, lisensi, profil terhubung user.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { DoctorsController } from "./doctors.controller";
import { DoctorsService } from "./doctors.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService]
})
export class DoctorsModule {}

