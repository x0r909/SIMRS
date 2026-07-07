/**
 * @file minio.health.ts
 * @path apps/backend/src/modules/health/minio.health.ts
 * @description Kode backend modul health.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";

import { MinioService } from "../../shared/storage/minio.service";

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  constructor(private readonly minio: MinioService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.minio.ensureBucket();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError("MinIO check failed", this.getStatus(key, false, { error }));
    }
  }
}
