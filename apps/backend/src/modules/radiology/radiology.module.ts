/**
 * @file radiology.module.ts
 * @path apps/backend/src/modules/radiology/radiology.module.ts
 * @description Modul NestJS radiology: wiring dependency injection. Radiologi: order pemeriksaan, upload hasil, verifikasi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { RadiologyController } from "./radiology.controller";
import { RadiologyService } from "./radiology.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [RadiologyController],
  providers: [RadiologyService],
  exports: [RadiologyService]
})
export class RadiologyModule {}
