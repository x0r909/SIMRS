/**
 * @file update-visit.dto.ts
 * @path apps/backend/src/modules/visits/dto/update-visit.dto.ts
 * @description DTO validasi request visits: update-visit (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PartialType } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

import { CreateVisitDto } from "./create-visit.dto";

export class UpdateVisitDto extends PartialType(CreateVisitDto) {
	@IsOptional()
	@IsString()
	diagnosis?: string;

	@IsOptional()
	@IsDateString()
	endedAt?: string;
}

