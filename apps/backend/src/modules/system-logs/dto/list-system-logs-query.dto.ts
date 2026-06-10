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
