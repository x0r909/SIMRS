import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import * as fs from "fs";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuditAction, AuditModule, AuditStatus } from "@prisma/client";

import {
  isJsonBackupFile,
  runPgDumpToFile,
  runPsqlRestoreFromFile
} from "./postgres-cli.util";

type PrismaJsonBackup = {
  exportedAt?: string;
  format?: string;
  permissions?: Record<string, unknown>[];
  roles?: Record<string, unknown>[];
  users?: Record<string, unknown>[];
  patients?: Record<string, unknown>[];
  doctors?: Record<string, unknown>[];
};

@Injectable()
export class BackupService {
  private readonly logger = new Logger("BackupService");
  private readonly backupDir = path.join(process.cwd(), "backups");

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private getPostgresContainerName(): string {
    return this.config.get<string>("POSTGRES_CONTAINER_NAME", "simrs-postgres");
  }

  async createBackup(actorId: string | undefined, description?: string) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const databaseUrl = this.config.get<string>("DATABASE_URL");
      if (!databaseUrl) {
        throw new BadRequestException("DATABASE_URL not configured");
      }

      const containerName = this.getPostgresContainerName();
      let filename = `backup-${timestamp}.sql`;
      let backupPath = path.join(this.backupDir, filename);
      let backupMethod = "pg_dump";

      this.logger.log(`Creating backup: ${filename}`);

      try {
        const mode = runPgDumpToFile(databaseUrl, backupPath, containerName);
        this.logger.log(`Backup SQL created via ${mode} pg_dump`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`pg_dump unavailable (${errorMsg}), using Prisma JSON fallback`);
        filename = `backup-${timestamp}.json`;
        backupPath = path.join(this.backupDir, filename);
        backupMethod = "prisma-json";
        await this.createPrismaBackup(backupPath);
      }

      const stats = fs.statSync(backupPath);
      const size = stats.size;

      const backup = await this.prisma.databaseBackup.create({
        data: {
          filename,
          description: description
            ? `${description} [${backupMethod}]`
            : `[${backupMethod}]`,
          size,
          backupPath,
          status: "COMPLETED",
          completedAt: new Date(),
          createdById: actorId
        },
        include: { createdBy: { select: { id: true, email: true, name: true } } }
      });

      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_BACKUP,
        module: AuditModule.SYSTEM,
        entity: "DatabaseBackup",
        entityId: backup.id,
        status: AuditStatus.SUCCESS,
        description: `Database backup created: ${filename}`,
        metadata: { filename, size, description, method: backupMethod }
      });

      this.logger.log(`Backup created successfully: ${filename} (${this.formatSize(size)})`);
      return backup;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Backup failed: ${errorMsg}`);

      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_BACKUP,
        module: AuditModule.SYSTEM,
        entity: "DatabaseBackup",
        status: AuditStatus.FAILED,
        description: `Database backup failed: ${errorMsg}`,
        metadata: { error: errorMsg }
      });

      throw new InternalServerErrorException("Failed to create backup");
    }
  }

  async restoreBackup(
    actorId: string | undefined,
    backupId: string,
    options?: { mfaCode?: string; confirmText?: string }
  ) {
    if (options?.confirmText !== "CONFIRM_RESTORE") {
      throw new BadRequestException('Konfirmasi restore dengan mengetik "CONFIRM_RESTORE"');
    }

    if (actorId && options?.mfaCode) {
      const user = await this.prisma.user.findUnique({ where: { id: actorId } });
      if (user?.mfaEnabled && user.mfaSecret) {
        const { authenticator } = await import("otplib");
        if (!authenticator.verify({ token: options.mfaCode, secret: user.mfaSecret })) {
          throw new BadRequestException("Invalid MFA code");
        }
      }
    }

    try {
      const backup = await this.prisma.databaseBackup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        throw new BadRequestException("Backup not found");
      }

      if (!fs.existsSync(backup.backupPath)) {
        throw new BadRequestException("Backup file not found");
      }

      this.logger.log(`Restoring backup: ${backup.filename}`);

      const databaseUrl = this.config.get<string>("DATABASE_URL");
      if (!databaseUrl) {
        throw new BadRequestException("DATABASE_URL not configured");
      }

      const containerName = this.getPostgresContainerName();

      if (isJsonBackupFile(backup.backupPath)) {
        await this.restorePrismaBackup(backup.backupPath);
        this.logger.log("Restored partial JSON backup via Prisma");
      } else {
        const mode = runPsqlRestoreFromFile(databaseUrl, backup.backupPath, containerName);
        this.logger.log(`Restored SQL backup via ${mode} psql`);
      }

      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_RESTORE,
        module: AuditModule.SYSTEM,
        entity: "DatabaseBackup",
        entityId: backup.id,
        status: AuditStatus.SUCCESS,
        description: `Database restored from backup: ${backup.filename}`,
        metadata: { backupId, filename: backup.filename }
      });

      this.logger.log(`Backup restored successfully: ${backup.filename}`);
      return { message: "Backup restored successfully", backupId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Restore failed: ${errorMsg}`);

      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_RESTORE,
        module: AuditModule.SYSTEM,
        entity: "DatabaseBackup",
        status: AuditStatus.FAILED,
        description: `Database restore failed: ${errorMsg}`,
        metadata: { backupId, error: errorMsg }
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Gagal restore backup: ${errorMsg}. Pastikan Docker postgres (${this.getPostgresContainerName()}) berjalan untuk backup SQL.`
      );
    }
  }

  async listBackups(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.databaseBackup.count(),
      this.prisma.databaseBackup.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, email: true, name: true } } }
      })
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBackup(id: string) {
    const backup = await this.prisma.databaseBackup.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, email: true, name: true } } }
    });

    if (!backup) {
      throw new BadRequestException("Backup not found");
    }

    return backup;
  }

  async deleteBackup(actorId: string | undefined, id: string) {
    const backup = await this.getBackup(id);

    if (fs.existsSync(backup.backupPath)) {
      fs.unlinkSync(backup.backupPath);
    }

    await this.prisma.databaseBackup.delete({ where: { id } });

    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      module: AuditModule.SYSTEM,
      entity: "DatabaseBackup",
      entityId: id,
      status: AuditStatus.SUCCESS,
      description: `Backup deleted: ${backup.filename}`,
      metadata: { filename: backup.filename }
    });

    return { message: "Backup deleted successfully" };
  }

  async downloadBackup(id: string) {
    const backup = await this.getBackup(id);

    if (!fs.existsSync(backup.backupPath)) {
      throw new BadRequestException("Backup file not found");
    }

    return {
      path: backup.backupPath,
      filename: backup.filename
    };
  }

  private async createPrismaBackup(backupPath: string) {
    this.logger.log("Using Prisma JSON fallback for backup (partial export)");

    const payload: PrismaJsonBackup = {
      format: "prisma-json-v1",
      exportedAt: new Date().toISOString(),
      permissions: await this.prisma.permission.findMany(),
      roles: await this.prisma.role.findMany(),
      users: await this.prisma.user.findMany(),
      patients: await this.prisma.patient.findMany(),
      doctors: await this.prisma.doctor.findMany()
    };

    fs.writeFileSync(backupPath, JSON.stringify(payload, null, 2));
  }

  private async restorePrismaBackup(backupPath: string) {
    const raw = fs.readFileSync(backupPath, "utf-8");
    const data = JSON.parse(raw) as PrismaJsonBackup;

    if (!data.exportedAt || data.format !== "prisma-json-v1") {
      throw new BadRequestException(
        "Format backup JSON tidak dikenali. Buat backup baru dengan Docker postgres aktif untuk SQL lengkap."
      );
    }

    this.logger.warn(
      "Restore JSON hanya mengembalikan subset tabel (users, roles, permissions, patients, doctors)"
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.patient.deleteMany();
      await tx.doctor.deleteMany();
      await tx.userRole.deleteMany();
      await tx.rolePermission.deleteMany();
      await tx.user.deleteMany();
      await tx.role.deleteMany();
      await tx.permission.deleteMany();

      if (data.permissions?.length) {
        await tx.permission.createMany({
          data: data.permissions as never[],
          skipDuplicates: true
        });
      }
      if (data.roles?.length) {
        await tx.role.createMany({ data: data.roles as never[], skipDuplicates: true });
      }
      if (data.users?.length) {
        await tx.user.createMany({ data: data.users as never[], skipDuplicates: true });
      }
      if (data.doctors?.length) {
        await tx.doctor.createMany({ data: data.doctors as never[], skipDuplicates: true });
      }
      if (data.patients?.length) {
        await tx.patient.createMany({ data: data.patients as never[], skipDuplicates: true });
      }
    });
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / k ** i) * 100) / 100 + " " + sizes[i];
  }
}
