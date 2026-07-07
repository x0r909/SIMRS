/**
 * @file set-queue-status.dto.ts
 * @path apps/backend/src/modules/queues/dto/set-queue-status.dto.ts
 * @description DTO validasi request queues: set-queue-status (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsIn } from "class-validator";
import type { QueueStatus } from "@prisma/client";

export class SetQueueStatusDto {
  @IsIn(["WAITING", "CALLED", "IN_PROGRESS", "DONE", "SKIP", "CANCEL"])
  status!: QueueStatus;
}
