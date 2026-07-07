/**
 * @file update-medicine.dto.ts
 * @path apps/backend/src/modules/medicines/dto/update-medicine.dto.ts
 * @description DTO validasi request medicines: update-medicine (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PartialType } from "@nestjs/swagger";

import { CreateMedicineDto } from "./create-medicine.dto";

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {}

