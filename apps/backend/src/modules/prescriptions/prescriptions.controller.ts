import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { PrescriptionsService } from "./prescriptions.service";

@ApiTags("prescriptions")
@Controller("prescriptions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Get()
  @RequirePermissions("pharmacy.read")
  list(@Query() query: PaginationQueryDto, @Query("status") status?: string) {
    return this.prescriptions.list({ ...query, status });
  }

  @Get(":id")
  @RequirePermissions("pharmacy.read")
  get(@Param("id") id: string) {
    return this.prescriptions.get(id);
  }

  @Post()
  @RequirePermissions("medical-records.write")
  create(@CurrentUser("sub") actorId: string, @Body() body: Record<string, unknown>) {
    return this.prescriptions.create(actorId, body as Parameters<PrescriptionsService["create"]>[1]);
  }

  @Patch(":id/dispense")
  @RequirePermissions("pharmacy.dispense")
  dispense(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.prescriptions.dispense(actorId, id);
  }
}
