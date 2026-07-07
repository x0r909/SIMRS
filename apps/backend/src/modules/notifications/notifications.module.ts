/**
 * @file notifications.module.ts
 * @path apps/backend/src/modules/notifications/notifications.module.ts
 * @description Modul NestJS notifications: wiring dependency injection. Notifikasi in-app untuk pengguna.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
