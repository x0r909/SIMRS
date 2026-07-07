/**
 * @file patients.controller.ts
 * @path apps/backend/src/modules/patients/patients.controller.ts
 * @description Controller REST API patients: endpoint HTTP. Manajemen pasien: MRN, data sensitif terenkripsi, blind index, CRUD.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import type { JwtPayload } from "../auth/types";

import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { PatientsService } from "./patients.service";

@ApiTags("patients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("patients")
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @RequirePermissions("patients.read")
  @Get()
  async list(@CurrentUser() actor: JwtPayload, @Query() query: PaginationQueryDto) {
    const result = await this.patients.list(query, actor);
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get("me")
  async getMine(@CurrentUser("sub") userId: string) {
    const patient = await this.patients.getMine(userId);
    return { success: true, data: patient };
  }

  @RequirePermissions("patients.read")
  @Get("by-user/:userId")
  getByUser(@CurrentUser() actor: JwtPayload, @Param("userId") userId: string) {
    return this.patients.getByUserId(userId, actor);
  }

  @RequirePermissions("patients.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.patients.get(id);
  }

  @RequirePermissions("patients.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreatePatientDto) {
    return this.patients.create(actorId, dto);
  }

  @RequirePermissions("patients.write")
  @Put(":id")
  update(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() dto: UpdatePatientDto) {
    return this.patients.update(actorId, id, dto);
  }

  @RequirePermissions("patients.write")
  @Delete(":id")
  remove(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.patients.remove(actorId, id);
  }
}

