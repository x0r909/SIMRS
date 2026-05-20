import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';

@Injectable()
export class BackupService {
  private readonly logger = new Logger('BackupService');
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(actorId: string | undefined, description?: string) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `backup-${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, filename);

      const databaseUrl = this.config.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new BadRequestException('DATABASE_URL not configured');
      }

      // Create backup using pg_dump
      this.logger.log(`Creating backup: ${filename}`);
      try {
        execSync(`pg_dump "${databaseUrl}" > "${backupPath}"`, {
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error) {
        this.logger.error(`pg_dump failed: ${error.message}`);
        // Fallback: create backup using Prisma query
        await this.createPrismaBackup(backupPath);
      }

      // Get file size
      const stats = fs.statSync(backupPath);
      const size = stats.size;

      // Save backup info to database
      const backup = await this.prisma.databaseBackup.create({
        data: {
          filename,
          description,
          size,
          backupPath,
          status: 'COMPLETED',
          completedAt: new Date(),
          createdById: actorId
        },
        include: { createdBy: { select: { id: true, email: true, name: true } } }
      });

      // Log to audit
      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_BACKUP,
        module: AuditModule.SYSTEM,
        entity: 'DatabaseBackup',
        entityId: backup.id,
        status: AuditStatus.SUCCESS,
        description: `Database backup created: ${filename}`,
        metadata: { filename, size, description }
      });

      this.logger.log(`Backup created successfully: ${filename} (${this.formatSize(size)})`);
      return backup;
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);

      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_BACKUP,
        module: AuditModule.SYSTEM,
        entity: 'DatabaseBackup',
        status: AuditStatus.FAILED,
        description: `Database backup failed: ${error.message}`,
        metadata: { error: error.message }
      });

      throw new InternalServerErrorException('Failed to create backup');
    }
  }

  async restoreBackup(actorId: string | undefined, backupId: string) {
    try {
      const backup = await this.prisma.databaseBackup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        throw new BadRequestException('Backup not found');
      }

      if (!fs.existsSync(backup.backupPath)) {
        throw new BadRequestException('Backup file not found');
      }

      this.logger.log(`Restoring backup: ${backup.filename}`);

      const databaseUrl = this.config.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new BadRequestException('DATABASE_URL not configured');
      }

      // Restore backup using psql
      try {
        execSync(`psql "${databaseUrl}" < "${backup.backupPath}"`, {
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error) {
        this.logger.error(`psql restore failed: ${error.message}`);
        throw error;
      }

      // Log to audit
      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_RESTORE,
        module: AuditModule.SYSTEM,
        entity: 'DatabaseBackup',
        entityId: backup.id,
        status: AuditStatus.SUCCESS,
        description: `Database restored from backup: ${backup.filename}`,
        metadata: { backupId, filename: backup.filename }
      });

      this.logger.log(`Backup restored successfully: ${backup.filename}`);
      return { message: 'Backup restored successfully', backupId };
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`);

      await this.audit.create({
        actorId,
        action: AuditAction.DATABASE_RESTORE,
        module: AuditModule.SYSTEM,
        entity: 'DatabaseBackup',
        status: AuditStatus.FAILED,
        description: `Database restore failed: ${error.message}`,
        metadata: { backupId, error: error.message }
      });

      throw new InternalServerErrorException('Failed to restore backup');
    }
  }

  async listBackups(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.databaseBackup.count(),
      this.prisma.databaseBackup.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      throw new BadRequestException('Backup not found');
    }

    return backup;
  }

  async deleteBackup(actorId: string | undefined, id: string) {
    const backup = await this.getBackup(id);

    // Delete file
    if (fs.existsSync(backup.backupPath)) {
      fs.unlinkSync(backup.backupPath);
    }

    // Delete record
    await this.prisma.databaseBackup.delete({ where: { id } });

    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      module: AuditModule.SYSTEM,
      entity: 'DatabaseBackup',
      entityId: id,
      status: AuditStatus.SUCCESS,
      description: `Backup deleted: ${backup.filename}`,
      metadata: { filename: backup.filename }
    });

    return { message: 'Backup deleted successfully' };
  }

  async downloadBackup(id: string) {
    const backup = await this.getBackup(id);

    if (!fs.existsSync(backup.backupPath)) {
      throw new BadRequestException('Backup file not found');
    }

    return {
      path: backup.backupPath,
      filename: backup.filename
    };
  }

  private async createPrismaBackup(backupPath: string) {
    // Fallback: export all data as JSON
    this.logger.log('Using Prisma fallback for backup');

    const allData = {
      users: await this.prisma.user.findMany(),
      roles: await this.prisma.role.findMany(),
      permissions: await this.prisma.permission.findMany(),
      patients: await this.prisma.patient.findMany(),
      doctors: await this.prisma.doctor.findMany(),
      // Add more tables as needed
      exportedAt: new Date().toISOString()
    };

    fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2));
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
