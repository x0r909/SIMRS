/**
 * @file auth.controller.ts
 * @path apps/backend/src/modules/auth/auth.controller.ts
 * @description Controller REST API auth: endpoint HTTP. Autentikasi JWT, sesi Redis, MFA TOTP, login staff/pasien, registrasi, dan profil.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Delete, Get, Patch, Post, Param, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterPatientDto } from "./dto/register-patient.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { JwtPayload } from "./types";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string> }) {
    return this.auth.login(
      dto.email,
      dto.password,
      { ip: req.ip, userAgent: req.headers["user-agent"] },
      "staff"
    );
  }

  @Post("login/staff")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginStaff(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string> }) {
    return this.auth.login(
      dto.email,
      dto.password,
      { ip: req.ip, userAgent: req.headers["user-agent"] },
      "staff"
    );
  }

  @Post("login/patient")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginPatient(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string> }) {
    return this.auth.login(
      dto.email,
      dto.password,
      { ip: req.ip, userAgent: req.headers["user-agent"] },
      "patient"
    );
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@CurrentUser() user: JwtPayload, @Body() body: { refreshToken?: string }) {
    return this.auth.logout(user.jti, body.refreshToken);
  }

  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("register-patient")
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  registerPatient(@Body() dto: RegisterPatientDto) {
    return this.auth.registerPatient(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser("sub") userId: string) {
    return this.auth.me(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  updateProfile(@CurrentUser("sub") userId: string, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("enable-mfa")
  enableMfa(@CurrentUser("sub") userId: string) {
    return this.auth.enableMfa(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("verify-mfa")
  verifyMfa(@CurrentUser("sub") userId: string, @Body() body: { token: string; enable?: boolean }) {
    if (body.enable) return this.auth.verifyAndEnableMfa(userId, body.token);
    return this.auth.verifyMfa(userId, body.token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  sessions(@CurrentUser("sub") userId: string) {
    return this.auth.listSessions(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete("sessions/:id")
  revokeSession(@CurrentUser("sub") userId: string, @Param("id") sessionId: string) {
    return this.auth.revokeSession(userId, sessionId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.force-logout")
  @Post("users/:userId/force-logout")
  forceLogout(@CurrentUser("sub") actorId: string, @Param("userId") targetUserId: string) {
    return this.auth.forceLogoutUser(actorId, targetUserId);
  }
}
