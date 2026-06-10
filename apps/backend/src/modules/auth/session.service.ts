import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";

import { PrismaService } from "../../shared/prisma/prisma.service";
import { RedisService } from "../../shared/redis/redis.service";

const MAX_SESSIONS = 3;

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService
  ) {}

  generateRefreshToken(): string {
    return randomBytes(48).toString("hex");
  }

  generateJti(): string {
    return randomBytes(16).toString("hex");
  }

  async createSession(
    userId: string,
    refreshToken: string,
    meta?: { deviceInfo?: string; ipAddress?: string; userAgent?: string }
  ) {
    const ttl = Number(this.config.get("JWT_REFRESH_TTL_SECONDS", 604800));
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const activeSessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "asc" }
    });

    if (activeSessions.length >= MAX_SESSIONS) {
      const toRevoke = activeSessions.slice(0, activeSessions.length - MAX_SESSIONS + 1);
      for (const s of toRevoke) {
        await this.revokeSession(s.id, s.refreshToken);
      }
    }

    await this.redis.set(`refresh:${refreshToken}`, userId, ttl);

    return this.prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
        deviceInfo: meta?.deviceInfo,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      }
    });
  }

  async validateRefreshToken(refreshToken: string): Promise<string> {
    const userId = await this.redis.get(`refresh:${refreshToken}`);
    if (!userId) throw new UnauthorizedException("Invalid refresh token");

    const session = await this.prisma.userSession.findUnique({ where: { refreshToken } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or revoked");
    }
    return userId;
  }

  async revokeSession(sessionId: string, refreshToken: string) {
    await this.redis.del(`refresh:${refreshToken}`);
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });
  }

  async revokeByRefreshToken(refreshToken: string) {
    const session = await this.prisma.userSession.findUnique({ where: { refreshToken } });
    if (session) {
      await this.revokeSession(session.id, refreshToken);
    }
  }

  async blacklistJti(jti: string, ttlSeconds: number) {
    await this.redis.set(`blacklist:${jti}`, "1", ttlSeconds);
  }

  async isJtiBlacklisted(jti: string): Promise<boolean> {
    const val = await this.redis.get(`blacklist:${jti}`);
    return val === "1";
  }

  async forceLogoutUser(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null }
    });
    for (const s of sessions) {
      await this.revokeSession(s.id, s.refreshToken);
    }
  }

  async listUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true
      }
    });
  }
}
