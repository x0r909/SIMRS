import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import {
  CreateAuditLogDTO,
  AuditLogFilterParams,
  AuditLogResponse,
  PaginatedAuditLogsResponse,
  AuditLogStatsResponse,
} from './audit.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(dto: CreateAuditLogDTO): Promise<void> {
    try {
      console.log(`[AUDIT SERVICE] Creating audit log:`, {
        action: dto.action,
        module: dto.module,
        entity: dto.entity,
        actorId: dto.actorId,
      });
      await this.prisma.auditLog.create({
        data: {
          action: dto.action,
          module: dto.module,
          entity: dto.entity,
          entityId: dto.entityId,
          description: dto.description,
          metadata: dto.metadata,
          status: dto.status || AuditStatus.SUCCESS,
          ip: dto.ip,
          userAgent: dto.userAgent,
          actorId: dto.actorId,
        },
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - logging should not break the main operation
    }
  }

  async getLogs(
    params: AuditLogFilterParams,
  ): Promise<PaginatedAuditLogsResponse> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (params.action) {
      where.action = params.action;
    }

    if (params.module) {
      where.module = params.module;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.userId) {
      where.actorId = params.userId;
    }

    if (params.search) {
      where.OR = [
        {
          entity: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          actor: {
            name: {
              contains: params.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            include: {
              roles: {
                include: {
                  role: {
                    select: {
                      name: true,
                      key: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: params.sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(this.formatAuditLogResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getStats(): Promise<AuditLogStatsResponse> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalActivityToday, totalLogin, totalDataChanges, totalErrors] =
      await Promise.all([
        this.prisma.auditLog.count({
          where: {
            createdAt: {
              gte: startOfDay,
            },
          },
        }),
        this.prisma.auditLog.count({
          where: {
            action: AuditAction.LOGIN,
            createdAt: {
              gte: startOfDay,
            },
          },
        }),
        this.prisma.auditLog.count({
          where: {
            action: {
              in: [
                AuditAction.USER_CREATE,
                AuditAction.USER_UPDATE,
                AuditAction.USER_DELETE,
                AuditAction.PATIENT_CREATE,
                AuditAction.PATIENT_UPDATE,
                AuditAction.PATIENT_DELETE,
                AuditAction.DIAGNOSIS_ADD,
                AuditAction.MEDICAL_RECORD_UPDATE,
                AuditAction.PRESCRIPTION_ADD,
              ],
            },
            createdAt: {
              gte: startOfDay,
            },
          },
        }),
        this.prisma.auditLog.count({
          where: {
            status: {
              in: [AuditStatus.ERROR, AuditStatus.FAILED],
            },
            createdAt: {
              gte: startOfDay,
            },
          },
        }),
      ]);

    return {
      totalActivityToday,
      totalLogin,
      totalDataChanges,
      totalErrors,
    };
  }

  private formatAuditLogResponse(log: any): AuditLogResponse {
    return {
      id: log.id,
      action: log.action,
      module: log.module,
      status: log.status,
      entity: log.entity,
      entityId: log.entityId,
      description: log.description,
      createdAt: log.createdAt,
      actor: log.actor
        ? {
            id: log.actor.id,
            name: log.actor.name,
            email: log.actor.email,
            roles: log.actor.roles,
          }
        : undefined,
      ip: log.ip,
    };
  }

  async exportToExcel(params: AuditLogFilterParams): Promise<Buffer> {
    const ExcelJS = (await import('exceljs')).default;
    const logs = await this.getLogs({ ...params, limit: 10000, page: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    // Add headers
    worksheet.columns = [
      { header: 'Waktu', key: 'createdAt', width: 20 },
      { header: 'User', key: 'userName', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Module', key: 'module', width: 15 },
      { header: 'Aktivitas', key: 'action', width: 20 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'IP Address', key: 'ip', width: 15 },
    ];

    // Add data rows
    logs.data.forEach((log) => {
      worksheet.addRow({
        createdAt: log.createdAt.toLocaleString('id-ID'),
        userName: log.actor?.name || '-',
        role: log.actor?.roles[0]?.role.name || '-',
        module: log.module,
        action: this.getActionLabel(log.action),
        description: log.description || '-',
        status: log.status,
        ip: log.ip || '-',
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    return await workbook.xlsx.writeBuffer() as any;
  }

  async exportToPDF(params: AuditLogFilterParams): Promise<Buffer> {
    const PDFDocument = (await import('pdfkit')).default;
    const logs = await this.getLogs({ ...params, limit: 1000, page: 1 });

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Activity Log Report', {
      align: 'center',
    });
    doc.moveDown(0.5);

    // Date range
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Generated on: ${new Date().toLocaleString('id-ID')}`,
        { align: 'center' },
      );
    doc.moveDown(1);

    // Table headers
    const startX = 40;
    const cols: Array<{ label: string; x: number; width: number }> = [
      { label: 'Waktu', x: startX, width: 80 },
      { label: 'User', x: startX + 85, width: 70 },
      { label: 'Aktivitas', x: startX + 160, width: 80 },
      { label: 'Status', x: startX + 245, width: 60 },
    ];

    doc
      .fontSize(10)
      .font('Helvetica-Bold');
    cols.forEach((col) => {
      doc.text(col.label, col.x, doc.y, { width: col.width });
    });

    doc.moveTo(startX, doc.y + 5).lineTo(startX + 305, doc.y + 5).stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.fontSize(9).font('Helvetica');
    logs.data.forEach((log) => {
      const y = doc.y;
      const col0 = cols[0];
      const col1 = cols[1];
      const col2 = cols[2];
      const col3 = cols[3];
      
      if (!col0 || !col1 || !col2 || !col3) return;

      doc.text(
        log.createdAt.toLocaleString('id-ID'),
        col0.x,
        y,
        { width: col0.width },
      );
      doc.text(
        log.actor?.name || '-',
        col1.x,
        y,
        { width: col1.width },
      );
      doc.text(
        this.getActionLabel(log.action),
        col2.x,
        y,
        { width: col2.width },
      );
      doc.text(log.status, col3.x, y, { width: col3.width });
      doc.moveDown(1);
    });

    return await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  private getActionLabel(action: AuditAction): string {
    const labels: Record<AuditAction, string> = {
      [AuditAction.LOGIN]: 'Login',
      [AuditAction.LOGOUT]: 'Logout',
      [AuditAction.LOGIN_FAILED]: 'Login Gagal',
      [AuditAction.RESET_PASSWORD]: 'Reset Password',
      [AuditAction.CHANGE_PASSWORD]: 'Ganti Password',
      [AuditAction.USER_CREATE]: 'Buat User',
      [AuditAction.USER_UPDATE]: 'Edit User',
      [AuditAction.USER_DELETE]: 'Hapus User',
      [AuditAction.ROLE_CHANGE]: 'Ubah Role',
      [AuditAction.PATIENT_REGISTER]: 'Registrasi Pasien',
      [AuditAction.PATIENT_CREATE]: 'Buat Pasien',
      [AuditAction.PATIENT_UPDATE]: 'Edit Pasien',
      [AuditAction.PATIENT_DELETE]: 'Hapus Pasien',
      [AuditAction.DIAGNOSIS_ADD]: 'Tambah Diagnosa',
      [AuditAction.MEDICAL_RECORD_UPDATE]: 'Update Rekam Medis',
      [AuditAction.PRESCRIPTION_ADD]: 'Tambah Resep',
      [AuditAction.LAB_RESULT_UPLOAD]: 'Upload Hasil Lab',
      [AuditAction.APPOINTMENT_BOOK]: 'Booking Jadwal',
      [AuditAction.APPOINTMENT_RESCHEDULE]: 'Ubah Jadwal',
      [AuditAction.APPOINTMENT_CANCEL]: 'Batal Jadwal',
      [AuditAction.MEDICINE_STOCK_ADD]: 'Tambah Stok Obat',
      [AuditAction.MEDICINE_STOCK_UPDATE]: 'Update Stok Obat',
      [AuditAction.MEDICINE_OUT]: 'Obat Keluar',
      [AuditAction.DATABASE_BACKUP]: 'Backup Database',
      [AuditAction.DATABASE_RESTORE]: 'Restore Database',
      [AuditAction.SYSTEM_ERROR]: 'Error Sistem',
      [AuditAction.SETTING_UPDATE]: 'Update Setting',
      [AuditAction.OTHER]: 'Lainnya',
    };

    return labels[action] || action;
  }
}
