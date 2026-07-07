/**
 * @file system-logs.module.ts
 * @path apps/backend/src/modules/system-logs/system-logs.module.ts
 * @description Modul NestJS system-logs: wiring dependency injection. System log: log operasional aplikasi dan error backend.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";

import { SystemLogsController } from "./system-logs.controller";
import { SystemLogsService } from "./system-logs.service";

@Global()
@Module({
  controllers: [SystemLogsController],
  providers: [SystemLogsService],
  exports: [SystemLogsService]
})
export class SystemLogsModule {}
