/**
 * @file audit-logs.controller.ts
 * @path apps/backend/src/modules/audit-logs/audit-logs.controller.ts
 * @description Controller REST API audit-logs: endpoint HTTP. Audit trail: pencatatan aksi pengguna untuk compliance.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get, Query, UseGuards, Res, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@common/auth/jwt-auth.guard';
import { PermissionsGuard } from '@common/auth/permissions.guard';
import { RequirePermissions } from '@common/auth/permissions.decorator';
import { AuditService } from './audit.service';
import { AuditLogFilterParams } from './audit.types';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.read')
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const params: AuditLogFilterParams = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      action: action as AuditAction,
      module: module as AuditModule,
      status: status as AuditStatus,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sortBy: (sortBy as any) || 'createdAt',
      sortOrder: (sortOrder as any) || 'desc',
    };

    return this.auditService.getLogs(params);
  }

  @Get('stats')
  @RequirePermissions('audit.read')
  async getStats() {
    return this.auditService.getStats();
  }

  @Get('export/excel')
  @RequirePermissions('audit.export')
  async exportExcel(
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const params: AuditLogFilterParams = {
      action: action as AuditAction,
      module: module as AuditModule,
      status: status as AuditStatus,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const buffer = await this.auditService.exportToExcel(params);
    res?.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res?.setHeader('Content-Disposition', 'attachment; filename=audit-logs.xlsx');
    res?.send(buffer);
  }

  @Get('export/pdf')
  @RequirePermissions('audit.export')
  async exportPdf(
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const params: AuditLogFilterParams = {
      action: action as AuditAction,
      module: module as AuditModule,
      status: status as AuditStatus,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const buffer = await this.auditService.exportToPDF(params);
    res?.setHeader('Content-Type', 'application/pdf');
    res?.setHeader('Content-Disposition', 'attachment; filename=audit-logs.pdf');
    res?.send(buffer);
  }
}

