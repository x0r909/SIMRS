/**
 * @file set-radiology-order-status.dto.ts
 * @path apps/backend/src/modules/radiology/dto/set-radiology-order-status.dto.ts
 * @description DTO validasi request radiology: set-radiology-order-status (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsIn } from "class-validator";
import type { RadiologyOrderStatus } from "@prisma/client";

export class SetRadiologyOrderStatusDto {
  @IsIn(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status!: RadiologyOrderStatus;
}
