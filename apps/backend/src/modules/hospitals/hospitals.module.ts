/**
 * @file hospitals.module.ts
 * @path apps/backend/src/modules/hospitals/hospitals.module.ts
 * @description Modul NestJS hospitals: wiring dependency injection. Data rumah sakit: profil institusi, pengaturan RS.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { HospitalsController } from "./hospitals.controller";
import { HospitalsService } from "./hospitals.service";

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService]
})
export class HospitalsModule {}
