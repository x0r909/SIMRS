/**
 * @file list-system-logs-query.dto.ts
 * @path apps/backend/src/modules/system-logs/dto/list-system-logs-query.dto.ts
 * @description DTO validasi request system-logs: list-system-logs-query (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { LogLevel } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "../../../common/pagination/pagination";

export class ListSystemLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsString()
  service?: string;
}
