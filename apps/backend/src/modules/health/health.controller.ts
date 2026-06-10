import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import type { JwtPayload } from "../auth/types";

import { HospitalOverviewService } from "./hospital-overview.service";
import { MinioHealthIndicator } from "./minio.health";
import { PrismaHealthIndicator } from "./prisma.health";
import { RedisHealthIndicator } from "./redis.health";
import { SystemOverviewService } from "./system-overview.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly minioHealth: MinioHealthIndicator,
    private readonly systemOverview: SystemOverviewService,
    private readonly hospitalOverviewService: HospitalOverviewService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prismaHealth.isHealthy("database")]);
  }

  @Get("overview")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("system.config")
  overview() {
    return this.systemOverview.getSystemAdminOverview();
  }

  @Get("hospital-overview")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("reports.read")
  getHospitalOverview(@CurrentUser() user: JwtPayload, @Query("hospitalId") hospitalId?: string) {
    const scopedHospitalId = user.roles.includes("SYSTEM_ADMIN") ? hospitalId : user.hospitalId;
    return this.hospitalOverviewService.getOverview(scopedHospitalId);
  }

  @Get("detailed")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("system.config")
  @HealthCheck()
  detailed() {
    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
      () => this.redisHealth.isHealthy("redis"),
      () => this.minioHealth.isHealthy("minio")
    ]);
  }

  @Get("ready")
  @HealthCheck()
  ready() {
    return this.health.check([() => this.prismaHealth.isHealthy("database")]);
  }

  @Get("live")
  live() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
