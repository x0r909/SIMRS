/**
 * @file create-invoice.dto.ts
 * @path apps/backend/src/modules/billing/dto/create-invoice.dto.ts
 * @description DTO validasi request billing: create-invoice (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class InvoiceItemDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsInt()
  @Min(0)
  price!: number;
}

export class CreateInvoiceDto {
  @IsString()
  visitId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];
}

