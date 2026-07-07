/**
 * @file radiology.controller.ts
 * @path apps/backend/src/modules/radiology/radiology.controller.ts
 * @description Controller REST API radiology: endpoint HTTP. Radiologi: order pemeriksaan, upload hasil, verifikasi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { CreateRadiologyOrderDto } from "./dto/create-radiology-order.dto";
import { CreateRadiologyResultDto } from "./dto/create-radiology-result.dto";
import { SetRadiologyOrderStatusDto } from "./dto/set-radiology-order-status.dto";
import { RadiologyService } from "./radiology.service";

@ApiTags("radiology")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("radiology/orders")
export class RadiologyController {
  constructor(private readonly radiology: RadiologyService) {}

  @RequirePermissions("radiology.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.radiology.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("radiology.read")
  @Get("dashboard/summary")
  dailySummary(@Query("date") date?: string) {
    return this.radiology.dailySummary(date);
  }

  @RequirePermissions("radiology.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.radiology.get(id);
  }

  @RequirePermissions("radiology.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateRadiologyOrderDto) {
    return this.radiology.create(actorId, dto);
  }

  @RequirePermissions("radiology.write")
  @Put(":id/status")
  setStatus(
    @CurrentUser("sub") actorId: string,
    @Param("id") id: string,
    @Body() dto: SetRadiologyOrderStatusDto
  ) {
    return this.radiology.setStatus(actorId, id, dto.status);
  }

  @RequirePermissions("radiology.write")
  @Post(":id/results")
  addResult(
    @CurrentUser("sub") actorId: string,
    @Param("id") id: string,
    @Body() dto: CreateRadiologyResultDto
  ) {
    return this.radiology.addResult(actorId, id, dto);
  }
}
