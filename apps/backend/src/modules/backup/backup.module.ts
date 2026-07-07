/**
 * @file backup.module.ts
 * @path apps/backend/src/modules/backup/backup.module.ts
 * @description Modul NestJS backup: wiring dependency injection. Backup & restore database PostgreSQL terenkripsi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService]
})
export class BackupModule {}
