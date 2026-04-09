import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { CreateVisitDto } from "./dto/create-visit.dto";
import { UpdateVisitDto } from "./dto/update-visit.dto";
import { VisitsService } from "./visits.service";

@ApiTags("visits")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("visits")
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @RequirePermissions("visits.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.visits.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("visits.read")
  @Get("me")
  async listMine(@CurrentUser("sub") userId: string, @Query() query: PaginationQueryDto) {
    const result = await this.visits.listMine(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("visits.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.visits.get(id);
  }

  @RequirePermissions("visits.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateVisitDto) {
    return this.visits.create(actorId, dto);
  }

  @RequirePermissions("visits.write")
  @Put(":id")
  update(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() dto: UpdateVisitDto) {
    return this.visits.update(actorId, id, dto);
  }

  @RequirePermissions("visits.write")
  @Put(":id/end")
  end(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.visits.end(actorId, id);
  }
}

