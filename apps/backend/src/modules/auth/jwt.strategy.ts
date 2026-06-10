import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { UsersService } from "../users/users.service";

import { SessionService } from "./session.service";
import type { JwtPayload } from "./types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly sessions: SessionService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET")
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.jti) {
      const blacklisted = await this.sessions.isJtiBlacklisted(payload.jti);
      if (blacklisted) throw new UnauthorizedException("Token revoked");
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException("Invalid token");
    if (user.status !== "ACTIVE") throw new UnauthorizedException("User disabled");
    return payload;
  }
}
