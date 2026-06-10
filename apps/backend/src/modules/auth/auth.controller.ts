import { Body, Controller, Get, Post, UseGuards, Request, BadRequestException, UnauthorizedException, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { AuthService } from "./auth.service";

import { PasswordValidator } from "../../common/validators/password-validator";

import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterPatientDto } from "./dto/register-patient.dto";
import { RegisterDto, ChangePasswordDto } from "./dto/auth-validation.dto";

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

  /**
   * Health check
   */
  @Get("health")
  health() {
    return { status: "ok", message: "Authentication service is running" };
  }
}

