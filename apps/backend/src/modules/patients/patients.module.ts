/**
 * @file patients.module.ts
 * @path apps/backend/src/modules/patients/patients.module.ts
 * @description Modul NestJS patients: wiring dependency injection. Manajemen pasien: MRN, data sensitif terenkripsi, blind index, CRUD.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService]
})
export class PatientsModule {}

