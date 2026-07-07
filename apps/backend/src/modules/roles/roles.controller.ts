/**
 * @file roles.controller.ts
 * @path apps/backend/src/modules/roles/roles.controller.ts
 * @description Controller REST API roles: endpoint HTTP. Role RBAC: definisi peran dan assignment permission.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { CreateRoleDto } from "./dto/create-role.dto";
import { SetRolePermissionsDto } from "./dto/set-role-permissions.dto";
import { RolesService } from "./roles.service";

@ApiTags("roles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("roles")
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermissions("roles.read")
  @Get()
  list() {
    return this.roles.list();
  }

  @RequirePermissions("roles.write")
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @RequirePermissions("roles.write")
  @Put(":id/permissions")
  setPermissions(@Param("id") id: string, @Body() dto: SetRolePermissionsDto) {
    return this.roles.setPermissions(id, dto.permissionKeys);
  }
}

