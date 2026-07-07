/**
 * @file prescriptions.service.ts
 * @path apps/backend/src/modules/prescriptions/prescriptions.service.ts
 * @description Service bisnis prescriptions: logika domain & Prisma. Resep obat: item resep, status dispensing farmasi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  async list(query: PaginationQueryDto & { status?: string }) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where = query.status ? { status: query.status as "PENDING" | "DISPENSED" | "CANCELLED" } : {};
    const [total, data] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          medicalRecord: { include: { visit: { include: { patient: true, doctor: true } } } }
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        medicalRecord: { include: { visit: { include: { patient: true, doctor: true } } } }
      }
    });
    if (!rx) throw new NotFoundException("Prescription not found");
    return rx;
  }

  async create(
    actorId: string | undefined,
    data: {
      medicalRecordId: string;
      notes?: string;
      items: { medicineName: string; dose: string; frequency: string; duration: string; quantity: number; notes?: string }[];
    }
  ) {
    const rx = await this.prisma.prescription.create({
      data: {
        medicalRecordId: data.medicalRecordId,
        notes: data.notes,
        items: { create: data.items }
      },
      include: { items: true }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.PRESCRIPTION_ADD,
      entity: "Prescription",
      entityId: rx.id
    });
    return rx;
  }

  async dispense(actorId: string | undefined, id: string) {
    await this.get(id);
    const rx = await this.prisma.prescription.update({
      where: { id },
      data: { status: "DISPENSED", dispensedAt: new Date() },
      include: { items: true }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.PRESCRIPTION_DISPENSE,
      entity: "Prescription",
      entityId: id
    });
    return rx;
  }
}
