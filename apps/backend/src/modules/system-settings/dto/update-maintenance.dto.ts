import { IsBoolean, IsIn, IsISO8601, IsOptional, IsString, ValidateIf } from "class-validator";

import { MAINTENANCE_SCOPES } from "../maintenance.util";

export class UpdateMaintenanceDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsIn(MAINTENANCE_SCOPES)
  scope?: (typeof MAINTENANCE_SCOPES)[number];

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== "")
  @IsISO8601()
  endsAt?: string | null;
}
