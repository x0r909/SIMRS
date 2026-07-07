/**
 * @file permissions.controller.ts
 * @path apps/backend/src/modules/permissions/permissions.controller.ts
 * @description Controller REST API permissions: endpoint HTTP. Permission RBAC: daftar hak akses granular per modul.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { PermissionsService } from "./permissions.service";

@ApiTags("permissions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @RequirePermissions("permissions.read")
  @Get()
  list() {
    return this.permissions.list();
  }
}

