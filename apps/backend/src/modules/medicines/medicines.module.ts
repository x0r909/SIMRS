/**
 * @file medicines.module.ts
 * @path apps/backend/src/modules/medicines/medicines.module.ts
 * @description Modul NestJS medicines: wiring dependency injection. Master obat: inventori, stok, dan katalog farmasi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { MedicinesController } from "./medicines.controller";
import { MedicinesService } from "./medicines.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [MedicinesController],
  providers: [MedicinesService],
  exports: [MedicinesService]
})
export class MedicinesModule {}

