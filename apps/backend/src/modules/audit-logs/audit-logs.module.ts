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

