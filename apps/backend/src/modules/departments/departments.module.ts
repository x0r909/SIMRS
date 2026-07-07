/**
 * @file departments.module.ts
 * @path apps/backend/src/modules/departments/departments.module.ts
 * @description Modul NestJS departments: wiring dependency injection. Departemen/poli rumah sakit per institusi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { DepartmentsController } from "./departments.controller";
import { DepartmentsService } from "./departments.service";

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService]
})
export class DepartmentsModule {}
