/**
 * @file create-medicine.dto.ts
 * @path apps/backend/src/modules/medicines/dto/create-medicine.dto.ts
 * @description DTO validasi request medicines: create-medicine (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateMedicineDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  stock!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  price!: number;
}

