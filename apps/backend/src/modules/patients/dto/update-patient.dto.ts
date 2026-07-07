/**
 * @file update-patient.dto.ts
 * @path apps/backend/src/modules/patients/dto/update-patient.dto.ts
 * @description DTO validasi request patients: update-patient (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PartialType } from "@nestjs/swagger";

import { CreatePatientDto } from "./create-patient.dto";

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}

