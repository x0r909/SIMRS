/**
 * @file reports.module.ts
 * @path apps/backend/src/modules/reports/reports.module.ts
 * @description Modul NestJS reports: wiring dependency injection. Laporan operasional: ringkasan harian order RS.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { HealthModule } from "../health/health.module";

import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [HealthModule],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
