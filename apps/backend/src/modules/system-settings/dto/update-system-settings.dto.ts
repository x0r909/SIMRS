import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";

import { MAINTENANCE_SCOPES } from "../maintenance.util";

export class UpdateHospitalProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateOperationalSettingsDto {
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsIn(MAINTENANCE_SCOPES)
  maintenanceScope?: (typeof MAINTENANCE_SCOPES)[number];

  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== "")
  @IsISO8601()
  maintenanceEndsAt?: string | null;

  @IsOptional()
  @IsBoolean()
  allowPatientRegistration?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  backupRetentionDays?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  operatingHoursOpen?: string;

  @IsOptional()
  @IsString()
  operatingHoursClose?: string;
}

export class UpdateSystemSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateHospitalProfileDto)
  profile?: UpdateHospitalProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOperationalSettingsDto)
  operational?: UpdateOperationalSettingsDto;
}
