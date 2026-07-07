/**
 * @file laboratory.controller.ts
 * @path apps/backend/src/modules/laboratory/laboratory.controller.ts
 * @description Controller REST API laboratory: endpoint HTTP. Laboratorium: order tes, hasil, verifikasi analis.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { CreateLaboratoryOrderDto } from "./dto/create-laboratory-order.dto";
import { CreateLaboratoryResultDto } from "./dto/create-laboratory-result.dto";
import { SetLaboratoryOrderStatusDto } from "./dto/set-laboratory-order-status.dto";
import { LaboratoryService } from "./laboratory.service";

@ApiTags("laboratory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("laboratory/orders")
export class LaboratoryController {
  constructor(private readonly laboratory: LaboratoryService) {}

  @RequirePermissions("laboratory.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.laboratory.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("laboratory.read")
  @Get("me")
  async listMine(@CurrentUser("sub") userId: string, @Query() query: PaginationQueryDto) {
    const result = await this.laboratory.listMine(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("laboratory.read")
  @Get("dashboard/summary")
  dailySummary(@Query("date") date?: string) {
    return this.laboratory.dailySummary(date);
  }

  @RequirePermissions("laboratory.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.laboratory.get(id);
  }

  @RequirePermissions("laboratory.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateLaboratoryOrderDto) {
    return this.laboratory.create(actorId, dto);
  }

  @RequirePermissions("laboratory.write")
  @Put(":id/status")
  setStatus(
    @CurrentUser("sub") actorId: string,
    @Param("id") id: string,
    @Body() dto: SetLaboratoryOrderStatusDto
  ) {
    return this.laboratory.setStatus(actorId, id, dto.status);
  }

  @RequirePermissions("laboratory.write")
  @Post(":id/results")
  addResult(
    @CurrentUser("sub") actorId: string,
    @Param("id") id: string,
    @Body() dto: CreateLaboratoryResultDto
  ) {
    return this.laboratory.addResult(actorId, id, dto);
  }
}
