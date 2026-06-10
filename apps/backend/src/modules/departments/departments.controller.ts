import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { DepartmentsService } from "./departments.service";

@ApiTags("departments")
@Controller("departments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @RequirePermissions("departments.read")
  list(@Query("hospitalId") hospitalId?: string) {
    return this.departments.list(hospitalId);
  }

  @Get(":id")
  @RequirePermissions("departments.read")
  get(@Param("id") id: string) {
    return this.departments.get(id);
  }

  @Post()
  @RequirePermissions("departments.write")
  create(@Body() body: { name: string; code: string; description?: string; hospitalId?: string }) {
    return this.departments.create(body);
  }

  @Patch(":id")
  @RequirePermissions("departments.write")
  update(@Param("id") id: string, @Body() body: { name?: string; description?: string }) {
    return this.departments.update(id, body);
  }
}
