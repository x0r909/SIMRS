import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
<<<<<<< HEAD
import { PrismaModule } from "../../shared/prisma/prisma.module";
=======
import { CaptchaModule } from "../captcha/captcha.module";
import { UsersModule } from "../users/users.module";
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)

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
