<<<<<<< HEAD
import { Body, Controller, Get, Post, UseGuards, Request, BadRequestException, UnauthorizedException, Param } from "@nestjs/common";
=======
import { Body, Controller, Delete, Get, Patch, Post, Param, Req, UseGuards } from "@nestjs/common";
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
<<<<<<< HEAD
=======
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)
import { AuthService } from "./auth.service";

import { PasswordValidator } from "../../common/validators/password-validator";

import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterPatientDto } from "./dto/register-patient.dto";
<<<<<<< HEAD
import { RegisterDto, ChangePasswordDto } from "./dto/auth-validation.dto";
=======
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { JwtPayload } from "./types";
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService
  ) {}

  /**
   * Register - Rate limited to 5 per hour
   */
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async register(
    @Body() dto: RegisterDto,
    @Request() req: any
  ) {
    // Validate password complexity
    const passwordValidation = PasswordValidator.validate(dto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException({
        message: "Password tidak memenuhi kriteria",
        errors: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Check if password is commonly used
    if (PasswordValidator.isCommonPassword(dto.password)) {
      throw new BadRequestException("Password terlalu umum, gunakan password yang lebih unik");
    }

    // Register user
    const user = await this.auth.registerPatient({
      email: dto.email,
      name: dto.name,
      password: dto.password
    } as RegisterPatientDto);

    return {
      message: "Registrasi berhasil",
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name
      }
    };
  }

  /**
   * Login - Rate limited to 5 per 60 seconds
   */
  @Post("login")
<<<<<<< HEAD
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Request() req: any
  ) {
    try {
      const authResult = await this.auth.login(dto.email, dto.password);

      // TODO: implement session tracking
      // const session = await this.sessionManager.createSession(...)
      // const suspicious = await this.sessionManager.detectSuspiciousLogin(...)
      // await this.refreshTokenService.saveRefreshToken(...)

      return {
        message: "Login berhasil",
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        user: authResult.user
      };
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }
=======
  login(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string> }) {
    return this.auth.login(
      dto.email,
      dto.password,
      { ip: req.ip, userAgent: req.headers["user-agent"] },
      "staff"
    );
  }

  @Post("login/staff")
  loginStaff(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string> }) {
    return this.auth.login(
      dto.email,
      dto.password,
      { ip: req.ip, userAgent: req.headers["user-agent"] },
      "staff"
    );
  }

  @Post("login/patient")
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
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)
  }

  /**
   * Refresh token - Rate limited to 10 per 60 seconds
   */
  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Body() dto: RefreshTokenDto
  ) {
    try {
      // TODO: implement refresh token logic
      return {
        message: "Token refresh not yet implemented",
        accessToken: "",
        refreshToken: "",
        expiresIn: 900
      };
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }
  }

  /**
   * Register patient endpoint (existing)
   */
  @Post("register-patient")
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  registerPatient(@Body() dto: RegisterPatientDto) {
    return this.auth.registerPatient(dto);
  }

  /**
   * Change password
   */
  @Post("change-password")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;

    // Validate new password
    const passwordValidation = PasswordValidator.validate(dto.newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestException({
        message: "Password baru tidak memenuhi kriteria",
        errors: passwordValidation.errors
      });
    }

    // Check password confirmation
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Password baru dan konfirmasi tidak cocok");
    }

    // Check if same as old password
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException("Password baru harus berbeda dengan password lama");
    }

    try {
      // TODO: implement change password logic
      return {
        message: "Password change not yet implemented"
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Logout
   */
  @Post("logout")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Request() req: any
  ) {
    try {
      // TODO: implement logout logic
      return {
        message: "Logout berhasil"
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Get active sessions
   */
  @Get("sessions")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(
    @Request() req: any
  ) {
    try {
      // TODO: implement get sessions logic
      return {
        sessions: [],
        tokens: [],
        message: "Daftar sesi aktif"
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Logout from specific device
   */
  @Post("logout-device/:sessionId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutFromDevice(
    @Param("sessionId") sessionId: string,
    @Request() req: any
  ) {
    try {
      // TODO: implement logout device logic
      return {
        message: "Perangkat berhasil logout"
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Get current user info
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser("sub") userId: string) {
    return this.auth.me(userId);
  }
<<<<<<< HEAD

  /**
   * Health check
   */
  @Get("health")
  health() {
    return { status: "ok", message: "Authentication service is running" };
  }
}
=======
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)

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
