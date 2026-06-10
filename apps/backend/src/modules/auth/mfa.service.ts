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
