/**
 * @file app.controller.ts
 * @path apps/backend/src/app.controller.ts
 * @description Controller root: endpoint health check dasar API.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      name: "simrs-backend",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
