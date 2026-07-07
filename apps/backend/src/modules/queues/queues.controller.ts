/**
 * @file queues.controller.ts
 * @path apps/backend/src/modules/queues/queues.controller.ts
 * @description Controller REST API queues: endpoint HTTP. Antrian poli: nomor antrian, prioritas, status panggilan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { CreateQueueEntryDto } from "./dto/create-queue-entry.dto";
import { SetQueueStatusDto } from "./dto/set-queue-status.dto";
import { QueuesService } from "./queues.service";

@ApiTags("queues")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("queues")
export class QueuesController {
  constructor(private readonly queues: QueuesService) {}

  @RequirePermissions("queues.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.queues.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("queues.read")
  @Get("dashboard")
  dashboard(@Query("date") date?: string) {
    return this.queues.dashboard(date);
  }

  @RequirePermissions("queues.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.queues.get(id);
  }

  @RequirePermissions("queues.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateQueueEntryDto) {
    return this.queues.create(actorId, dto);
  }

  @RequirePermissions("queues.write")
  @Put(":id/status")
  setStatus(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() body: SetQueueStatusDto) {
    return this.queues.setStatus(actorId, id, body.status);
  }
}

