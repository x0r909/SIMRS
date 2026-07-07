/**
 * @file users.module.ts
 * @path apps/backend/src/modules/users/users.module.ts
 * @description Modul NestJS users: wiring dependency injection. Manajemen pengguna staff: CRUD user, assignment role & departemen.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}

