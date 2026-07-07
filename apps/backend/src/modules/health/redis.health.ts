/**
 * @file redis.health.ts
 * @path apps/backend/src/modules/health/redis.health.ts
 * @description Kode backend modul health.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";

import { RedisService } from "../../shared/redis/redis.service";

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.getClient().ping();
      return this.getStatus(key, pong === "PONG");
    } catch (error) {
      throw new HealthCheckError("Redis check failed", this.getStatus(key, false, { error }));
    }
  }
}
