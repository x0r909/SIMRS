/**
 * @file context.module.ts
 * @path apps/backend/src/shared/context/context.module.ts
 * @description Request context: hospital/department scope per request.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";

import { HospitalContextService } from "./hospital-context.service";

@Global()
@Module({
  providers: [HospitalContextService],
  exports: [HospitalContextService]
})
export class ContextModule {}
