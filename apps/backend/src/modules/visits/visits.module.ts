/**
 * @file visits.module.ts
 * @path apps/backend/src/modules/visits/visits.module.ts
 * @description Modul NestJS visits: wiring dependency injection. Kunjungan klinis: registrasi kunjungan, diagnosis, hubungan ke rekam medis.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { VisitsController } from "./visits.controller";
import { VisitsService } from "./visits.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService]
})
export class VisitsModule {}

