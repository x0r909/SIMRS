/**
 * @file system-settings.module.ts
 * @path apps/backend/src/modules/system-settings/system-settings.module.ts
 * @description Modul NestJS system-settings: wiring dependency injection. Pengaturan sistem: maintenance mode, konfigurasi publik.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { MaintenanceGuard } from "./maintenance.guard";
import { SystemSettingsController } from "./system-settings.controller";
import { SystemSettingsService } from "./system-settings.service";

@Global()
@Module({
  imports: [
    AuditLogsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET")
      })
    })
  ],
  controllers: [SystemSettingsController],
  providers: [
    SystemSettingsService,
    MaintenanceGuard,
    { provide: APP_GUARD, useClass: MaintenanceGuard }
  ],
  exports: [SystemSettingsService]
})
export class SystemSettingsModule {}
