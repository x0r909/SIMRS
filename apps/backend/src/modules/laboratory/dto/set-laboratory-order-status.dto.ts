import { IsIn } from "class-validator";
import type { LabOrderStatus } from "@prisma/client";

export class SetLaboratoryOrderStatusDto {
  @IsIn(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status!: LabOrderStatus;
}
