/**
 * @file laboratory.module.ts
 * @path apps/backend/src/modules/laboratory/laboratory.module.ts
 * @description Modul NestJS laboratory: wiring dependency injection. Laboratorium: order tes, hasil, verifikasi analis.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { LaboratoryController } from "./laboratory.controller";
import { LaboratoryService } from "./laboratory.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService]
})
export class LaboratoryModule {}
