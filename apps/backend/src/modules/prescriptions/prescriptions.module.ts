/**
 * @file prescriptions.module.ts
 * @path apps/backend/src/modules/prescriptions/prescriptions.module.ts
 * @description Modul NestJS prescriptions: wiring dependency injection. Resep obat: item resep, status dispensing farmasi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { PrescriptionsController } from "./prescriptions.controller";
import { PrescriptionsService } from "./prescriptions.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService]
})
export class PrescriptionsModule {}
