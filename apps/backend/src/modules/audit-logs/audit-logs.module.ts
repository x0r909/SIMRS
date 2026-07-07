/**
 * @file audit-logs.module.ts
 * @path apps/backend/src/modules/audit-logs/audit-logs.module.ts
 * @description Modul NestJS audit-logs: wiring dependency injection. Audit trail: pencatatan aksi pengguna untuk compliance.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditService } from './audit.service';
import { AuditLogsService } from './audit-logs.service';
import { AuditLoggingInterceptor } from './audit-logging.interceptor';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditService, AuditLogsService, AuditLoggingInterceptor],
  exports: [AuditService, AuditLogsService, AuditLoggingInterceptor],
})
export class AuditLogsModule {}

