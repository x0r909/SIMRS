import { IsIn } from "class-validator";
import type { RadiologyOrderStatus } from "@prisma/client";

export class SetRadiologyOrderStatusDto {
  @IsIn(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status!: RadiologyOrderStatus;
}
