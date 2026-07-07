/**
 * @file audit-logs.service.ts
 * @path apps/backend/src/modules/audit-logs/audit-logs.service.ts
 * @description Service bisnis audit-logs: logika domain & Prisma. Audit trail: pencatatan aksi pengguna untuk compliance.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { Prisma, AuditAction, AuditModule, AuditStatus } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const [total, data] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { id: true, email: true, name: true } } }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  create(input: {
    action: string | AuditAction;
    module?: AuditModule;
    entity: string;
    entityId?: string;
    actorId?: string | null;
    hospitalId?: string | null;
    ip?: string;
    userAgent?: string;
    description?: string;
    metadata?: unknown;
    status?: AuditStatus;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action as AuditAction,
        module: input.module || AuditModule.OTHER,
        entity: input.entity,
        entityId: input.entityId,
        actorId: input.actorId || null,
        hospitalId: input.hospitalId || null,
        ip: input.ip,
        userAgent: input.userAgent,
        description: input.description,
        status: input.status || AuditStatus.SUCCESS,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });
  }
}

