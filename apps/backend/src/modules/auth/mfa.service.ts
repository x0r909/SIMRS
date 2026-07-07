/**
 * @file mfa.service.ts
 * @path apps/backend/src/modules/auth/mfa.service.ts
 * @description Service bisnis auth: logika domain & Prisma. Autentikasi JWT, sesi Redis, MFA TOTP, login staff/pasien, registrasi, dan profil.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { authenticator } from "otplib";

@Injectable()
export class MfaService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, "SIMRS", secret);
  }

  verifyToken(secret: string, token: string): boolean {
    return authenticator.verify({ token, secret });
  }
}
