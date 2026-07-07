/**
 * @file update-doctor.dto.ts
 * @path apps/backend/src/modules/doctors/dto/update-doctor.dto.ts
 * @description DTO validasi request doctors: update-doctor (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PartialType } from "@nestjs/swagger";

import { CreateDoctorDto } from "./create-doctor.dto";

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}

