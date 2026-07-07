/**
 * @file auth.module.ts
 * @path apps/backend/src/modules/auth/auth.module.ts
 * @description Modul NestJS auth: wiring dependency injection. Autentikasi JWT, sesi Redis, MFA TOTP, login staff/pasien, registrasi, dan profil.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { CaptchaModule } from "../captcha/captcha.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { MfaService } from "./mfa.service";
import { SessionService } from "./session.service";


@Module({
  imports: [
    UsersModule,
    CaptchaModule,
    AuditLogsModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: { expiresIn: Number(config.get("JWT_ACCESS_TTL_SECONDS", 900)) }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SessionService, MfaService],
  exports: [AuthService, SessionService]
})
export class AuthModule {}
