/**
 * @file index.ts
 * @path apps/backend/src/modules/audit-logs/index.ts
 * @description Barrel export modul audit-logs.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

export { AuditService } from './audit.service';
export { AuditLoggingMiddleware } from './audit-logging.middleware';
export { AuditLogsController } from './audit-logs.controller';
export { AuditLogsModule } from './audit-logs.module';
export * from './audit.types';
