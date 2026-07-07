/**
 * @file medicines.controller.ts
 * @path apps/backend/src/modules/medicines/medicines.controller.ts
 * @description Controller REST API medicines: endpoint HTTP. Master obat: inventori, stok, dan katalog farmasi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { CreateMedicineDto } from "./dto/create-medicine.dto";
import { UpdateMedicineDto } from "./dto/update-medicine.dto";
import { MedicinesService } from "./medicines.service";

@ApiTags("medicines")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("medicines")
export class MedicinesController {
  constructor(private readonly meds: MedicinesService) {}

  @RequirePermissions("medicines.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.meds.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("medicines.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.meds.get(id);
  }

  @RequirePermissions("medicines.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateMedicineDto) {
    return this.meds.create(actorId, dto);
  }

  @RequirePermissions("medicines.write")
  @Put(":id")
  update(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() dto: UpdateMedicineDto) {
    return this.meds.update(actorId, id, dto);
  }

  @RequirePermissions("medicines.write")
  @Delete(":id")
  remove(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.meds.remove(actorId, id);
  }
}

