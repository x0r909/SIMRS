/**
 * @file permissions.module.ts
 * @path apps/backend/src/modules/permissions/permissions.module.ts
 * @description Modul NestJS permissions: wiring dependency injection. Permission RBAC: daftar hak akses granular per modul.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { PermissionsController } from "./permissions.controller";
import { PermissionsService } from "./permissions.service";

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService]
})
export class PermissionsModule {}

