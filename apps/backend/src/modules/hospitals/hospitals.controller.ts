import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { HospitalsService } from "./hospitals.service";

@ApiTags("hospitals")
@Controller("hospitals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HospitalsController {
  constructor(private readonly hospitals: HospitalsService) {}

  @Get()
  @RequirePermissions("hospitals.read")
  list() {
    return this.hospitals.list();
  }

  @Get("default")
  @RequirePermissions("hospitals.read")
  getDefault() {
    return this.hospitals.getDefault();
  }

  @Get(":id")
  @RequirePermissions("hospitals.read")
  get(@Param("id") id: string) {
    return this.hospitals.get(id);
  }

  @Patch(":id")
  @RequirePermissions("hospitals.write")
  update(
    @Param("id") id: string,
    @Body() body: { name?: string; address?: string; phone?: string; email?: string; logoUrl?: string }
  ) {
    return this.hospitals.update(id, body);
  }
}
