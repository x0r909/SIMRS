import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { SetAppointmentStatusDto } from "./dto/set-appointment-status.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@ApiTags("appointments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appts: AppointmentsService) {}

  @RequirePermissions("appointments.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.appts.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("appointments.read")
  @Get("me")
  async listMine(@CurrentUser("sub") userId: string, @Query() query: PaginationQueryDto) {
    const result = await this.appts.listMine(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("appointments.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.appts.get(id);
  }

  @RequirePermissions("appointments.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateAppointmentDto) {
    return this.appts.create(actorId, dto);
  }

  @RequirePermissions("appointments.write")
  @Put(":id")
  update(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appts.update(actorId, id, dto);
  }

  @RequirePermissions("appointments.write")
  @Put(":id/status")
  setStatus(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() dto: SetAppointmentStatusDto) {
    return this.appts.setStatus(actorId, id, dto.status);
  }

  @RequirePermissions("appointments.write")
  @Delete(":id")
  remove(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.appts.remove(actorId, id);
  }
}

