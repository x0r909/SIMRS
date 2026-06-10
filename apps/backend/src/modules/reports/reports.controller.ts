import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import type { JwtPayload } from "../auth/types";

import { ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("daily")
  @RequirePermissions("reports.read")
  daily(
    @CurrentUser() user: JwtPayload,
    @Query("hospitalId") hospitalId?: string,
    @Query("date") date?: string
  ) {
    const scopedHospitalId = user.roles.includes("SYSTEM_ADMIN") ? hospitalId : user.hospitalId;
    return this.reports.getDailyReport(scopedHospitalId, date);
  }
}
