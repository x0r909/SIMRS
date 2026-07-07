/**
 * @file queues.module.ts
 * @path apps/backend/src/modules/queues/queues.module.ts
 * @description Modul NestJS queues: wiring dependency injection. Antrian poli: nomor antrian, prioritas, status panggilan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { QueuesController } from "./queues.controller";
import { QueuesService } from "./queues.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [QueuesController],
  providers: [QueuesService],
  exports: [QueuesService]
})
export class QueuesModule {}

