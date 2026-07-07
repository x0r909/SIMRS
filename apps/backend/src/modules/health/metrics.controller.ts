/**
 * @file metrics.controller.ts
 * @path apps/backend/src/modules/health/metrics.controller.ts
 * @description Controller REST API health: endpoint HTTP. Health check: status Postgres, Redis, MinIO, metrik sistem.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get, Header } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path"],
  registers: [register]
});

@ApiTags("metrics")
@Controller()
export class MetricsController {
  @Get("metrics")
  @Header("Content-Type", "text/plain")
  async metrics() {
    return register.metrics();
  }
}
