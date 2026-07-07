/**
 * @file billing-list-query.dto.ts
 * @path apps/backend/src/modules/billing/dto/billing-list-query.dto.ts
 * @description DTO validasi request billing: billing-list-query (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "../../../common/pagination/pagination";

export class BillingListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
