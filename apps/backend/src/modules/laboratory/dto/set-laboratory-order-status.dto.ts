/**
 * @file set-laboratory-order-status.dto.ts
 * @path apps/backend/src/modules/laboratory/dto/set-laboratory-order-status.dto.ts
 * @description DTO validasi request laboratory: set-laboratory-order-status (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsIn } from "class-validator";
import type { LabOrderStatus } from "@prisma/client";

export class SetLaboratoryOrderStatusDto {
  @IsIn(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status!: LabOrderStatus;
}
