/**
 * @file system-settings.controller.ts
 * @path apps/backend/src/modules/system-settings/system-settings.controller.ts
 * @description Controller REST API system-settings: endpoint HTTP. Pengaturan sistem: maintenance mode, konfigurasi publik.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { UpdateMaintenanceDto } from "./dto/update-maintenance.dto";
import { UpdateSystemSettingsDto } from "./dto/update-system-settings.dto";
import { SystemSettingsService } from "./system-settings.service";

@ApiTags("system-settings")
@Controller("system/settings")
export class SystemSettingsController {
  constructor(private readonly settings: SystemSettingsService) {}

  @Get("public")
  getPublic() {
    return this.settings.getPublicSettings();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("system.config")
  @ApiBearerAuth()
  get() {
    return this.settings.getSettings();
  }

  @Patch("maintenance")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("system.config")
  @ApiBearerAuth()
  updateMaintenance(@CurrentUser("sub") actorId: string, @Body() dto: UpdateMaintenanceDto) {
    return this.settings.setMaintenanceMode(actorId, dto);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("system.config")
  @ApiBearerAuth()
  update(@CurrentUser("sub") actorId: string, @Body() dto: UpdateSystemSettingsDto) {
    return this.settings.updateSettings(actorId, dto);
  }
}
