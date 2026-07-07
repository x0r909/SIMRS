/**
 * @file files.module.ts
 * @path apps/backend/src/modules/files/files.module.ts
 * @description Modul NestJS files: wiring dependency injection. Upload/download file ke MinIO (hasil lab, radiologi, lampiran).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {}

