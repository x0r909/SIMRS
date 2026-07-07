/**
 * @file system-logs.service.ts
 * @path apps/backend/src/modules/system-logs/system-logs.service.ts
 * @description Service bisnis system-logs: logika domain & Prisma. System log: log operasional aplikasi dan error backend.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { LogLevel, Prisma } from "@prisma/client";
import { Observable, Subject } from "rxjs";

import { toSkipTake } from "../../common/pagination/pagination";

import { ListSystemLogsQueryDto } from "./dto/list-system-logs-query.dto";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RedisService } from "../../shared/redis/redis.service";

export type SystemLogInput = {
  level: LogLevel;
  service: string;
  context?: string;
  message: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  traceId?: string;
  ipAddress?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
};

@Injectable()
export class SystemLogsService {
  private readonly stream$ = new Subject<SystemLogInput>();
  private readonly CHANNEL = "simrs:system-logs";

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async create(input: SystemLogInput) {
    const log = await this.prisma.systemLog.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });
    const payload = JSON.stringify(input);
    await this.redis.publish(this.CHANNEL, payload).catch(() => undefined);
    this.stream$.next(input);
    return log;
  }

  async list(query: ListSystemLogsQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: Record<string, unknown> = {};
    if (query.level) where.level = query.level;
    if (query.service) where.service = query.service;

    const [total, rows] = await Promise.all([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
    ]);

    const userIds = [...new Set(rows.map((row) => row.userId).filter((id): id is string => Boolean(id)))];
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              email: true,
              name: true,
              roles: {
                select: {
                  role: { select: { key: true, name: true } }
                }
              }
            }
          })
        : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    const data = rows.map((row) => ({
      ...row,
      actor: row.userId ? (userMap.get(row.userId) ?? null) : null
    }));

    return { data, meta: { page, limit, total } };
  }

  async stats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [errors, warnings, total] = await Promise.all([
      this.prisma.systemLog.count({ where: { level: "ERROR", createdAt: { gte: since } } }),
      this.prisma.systemLog.count({ where: { level: "WARN", createdAt: { gte: since } } }),
      this.prisma.systemLog.count({ where: { createdAt: { gte: since } } })
    ]);
    return { errors, warnings, total, period: "24h" };
  }

  stream(): Observable<SystemLogInput> {
    return this.stream$.asObservable();
  }
}
