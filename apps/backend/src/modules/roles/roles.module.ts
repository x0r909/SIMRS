/**
 * @file roles.module.ts
 * @path apps/backend/src/modules/roles/roles.module.ts
 * @description Modul NestJS roles: wiring dependency injection. Role RBAC: definisi peran dan assignment permission.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService]
})
export class RolesModule {}

