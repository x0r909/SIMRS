import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfidentialityLevel } from "@prisma/client";

export const MAC_LEVEL_KEY = "mac_level";

@Injectable()
export class MacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevel = this.reflector.getAllAndOverride<ConfidentialityLevel | undefined>(
      MAC_LEVEL_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredLevel) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceLevel =
      (request.resource?.confidentialityLevel as ConfidentialityLevel | undefined) ?? "INTERNAL";

    const levelRank: Record<ConfidentialityLevel, number> = {
      PUBLIC: 0,
      INTERNAL: 1,
      CONFIDENTIAL: 2,
      RESTRICTED: 3
    };

    if (levelRank[resourceLevel] <= levelRank.INTERNAL) return true;

    if (resourceLevel === "CONFIDENTIAL") {
      const allowed = user.permissions?.includes("medical-records.read") ||
        user.roles?.includes("DOCTOR") ||
        user.roles?.includes("NURSE") ||
        user.roles?.includes("SYSTEM_ADMIN");
      if (!allowed) throw new ForbiddenException("MAC: confidential data access denied");
      return true;
    }

    if (resourceLevel === "RESTRICTED") {
      const allowed =
        user.permissions?.includes("medical-records.read-restricted") ||
        user.roles?.includes("SYSTEM_ADMIN");
      if (!allowed) throw new ForbiddenException("MAC: restricted data access denied");
      return true;
    }

    return true;
  }
}
