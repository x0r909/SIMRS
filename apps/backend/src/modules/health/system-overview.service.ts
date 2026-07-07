/**
 * @file system-overview.service.ts
 * @path apps/backend/src/modules/health/system-overview.service.ts
 * @description Service bisnis health: logika domain & Prisma. Health check: status Postgres, Redis, MinIO, metrik sistem.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { HealthCheckService } from "@nestjs/terminus";

import { PrismaService } from "../../shared/prisma/prisma.service";
import { SystemLogsService } from "../system-logs/system-logs.service";

import { MinioHealthIndicator } from "./minio.health";
import { PrismaHealthIndicator } from "./prisma.health";
import { RedisHealthIndicator } from "./redis.health";

export type OverviewStatStatus = "ok" | "warn" | "error" | "neutral";

export type OverviewStat = {
  label: string;
  value: string;
  description: string;
  status: OverviewStatStatus;
};

function formatProcessUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

function formatRelativeAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

@Injectable()
export class SystemOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly minioHealth: MinioHealthIndicator
  ) {}

  async getSystemAdminOverview(): Promise<{ stats: OverviewStat[]; generatedAt: string }> {
    const now = new Date();

    const [logStats, activeSessionCount, uniqueActiveUsers, latestBackup, backupCount, servicesHealthy] =
      await Promise.all([
        this.systemLogs.stats(),
        this.prisma.userSession.count({
          where: { revokedAt: null, expiresAt: { gt: now } }
        }),
        this.prisma.userSession
          .groupBy({
            by: ["userId"],
            where: { revokedAt: null, expiresAt: { gt: now } }
          })
          .then((rows) => rows.length),
        this.prisma.databaseBackup.findFirst({
          orderBy: { createdAt: "desc" },
          select: { filename: true, createdAt: true, status: true }
        }),
        this.prisma.databaseBackup.count(),
        this.checkServicesHealthy()
      ]);

    const errorRatePercent =
      logStats.total > 0 ? (logStats.errors / logStats.total) * 100 : 0;

    const uptimeValue = servicesHealthy ? "Operasional" : "Terganggu";
    const uptimeDescription = servicesHealthy
      ? `Backend aktif ${formatProcessUptime(process.uptime())} · DB, Redis, MinIO sehat`
      : "Satu atau lebih layanan (DB / Redis / MinIO) tidak sehat";

    let backupValue = "Belum ada";
    let backupDescription = "Buat backup pertama dari menu Backup";
    let backupStatus: OverviewStatStatus = "neutral";

    if (latestBackup) {
      const ageHours = (now.getTime() - latestBackup.createdAt.getTime()) / 3_600_000;
      const isRecent = ageHours <= 24;
      backupValue = isRecent ? "OK" : "Perlu";
      backupStatus = isRecent ? "ok" : "warn";
      backupDescription = `${latestBackup.filename} · ${formatRelativeAge(latestBackup.createdAt)} · total ${backupCount}`;
    }

    const stats: OverviewStat[] = [
      {
        label: "Status Layanan",
        value: uptimeValue,
        description: uptimeDescription,
        status: servicesHealthy ? "ok" : "error"
      },
      {
        label: "Error Rate",
        value: `${errorRatePercent.toFixed(2)}%`,
        description: `${logStats.errors} error dari ${logStats.total} log sistem (24 jam)`,
        status: errorRatePercent < 1 ? "ok" : errorRatePercent < 5 ? "warn" : "error"
      },
      {
        label: "Pengguna Aktif",
        value: String(uniqueActiveUsers),
        description: `${activeSessionCount} sesi login aktif saat ini`,
        status: "ok"
      },
      {
        label: "Backup",
        value: backupValue,
        description: backupDescription,
        status: backupStatus
      }
    ];

    return { stats, generatedAt: now.toISOString() };
  }

  private async checkServicesHealthy(): Promise<boolean> {
    try {
      const result = await this.health.check([
        () => this.prismaHealth.isHealthy("database"),
        () => this.redisHealth.isHealthy("redis"),
        () => this.minioHealth.isHealthy("minio")
      ]);
      return result.status === "ok";
    } catch {
      return false;
    }
  }
}
