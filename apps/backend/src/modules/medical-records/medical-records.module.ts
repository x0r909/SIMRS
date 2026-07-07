/**
 * @file medical-records.module.ts
 * @path apps/backend/src/modules/medical-records/medical-records.module.ts
 * @description Modul NestJS medical-records: wiring dependency injection. Rekam medis elektronik: SOAP, diagnosis ICD, finalisasi, kerahasiaan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { MedicalRecordsController } from "./medical-records.controller";
import { MedicalRecordsService } from "./medical-records.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService]
})
export class MedicalRecordsModule {}
