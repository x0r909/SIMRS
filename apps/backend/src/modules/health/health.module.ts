/**
 * @file health.module.ts
 * @path apps/backend/src/modules/health/health.module.ts
 * @description Modul NestJS health: wiring dependency injection. Health check: status Postgres, Redis, MinIO, metrik sistem.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { HealthController } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { MinioHealthIndicator } from "./minio.health";
import { PrismaHealthIndicator } from "./prisma.health";
import { RedisHealthIndicator } from "./redis.health";
import { HospitalOverviewService } from "./hospital-overview.service";
import { SystemOverviewService } from "./system-overview.service";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, MetricsController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    MinioHealthIndicator,
    SystemOverviewService,
    HospitalOverviewService
  ],
  exports: [HospitalOverviewService]
})
export class HealthModule {}
