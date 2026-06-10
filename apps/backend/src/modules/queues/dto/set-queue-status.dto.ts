import { IsIn } from "class-validator";
import type { QueueStatus } from "@prisma/client";

export class SetQueueStatusDto {
  @IsIn(["WAITING", "CALLED", "IN_PROGRESS", "DONE", "SKIP", "CANCEL"])
  status!: QueueStatus;
}
