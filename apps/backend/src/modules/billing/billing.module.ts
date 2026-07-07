/**
 * @file billing.module.ts
 * @path apps/backend/src/modules/billing/billing.module.ts
 * @description Modul NestJS billing: wiring dependency injection. Billing & pembayaran: invoice, tagihan kunjungan, metode bayar.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";

import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService]
})
export class BillingModule {}

