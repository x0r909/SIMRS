import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateLaboratoryOrderDto } from "./dto/create-laboratory-order.dto";
import { CreateLaboratoryResultDto } from "./dto/create-laboratory-result.dto";

type LaboratoryOrderStatus = "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  private async ensureVisitAndDoctor(visitId: string, doctorId: string) {
    const [visit, doctor] = await Promise.all([
      this.prisma.visit.findUnique({ where: { id: visitId }, select: { id: true } }),
      this.prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } })
    ]);
    if (!visit) throw new NotFoundException("Visit not found");
    if (!doctor) throw new NotFoundException("Doctor not found");
  }

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          OR: [
            { testType: { contains: query.q, mode: "insensitive" as const } },
            { status: { contains: query.q, mode: "insensitive" as const } },
            { visit: { patient: { name: { contains: query.q, mode: "insensitive" as const } } } },
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } }
          ]
        }
      : {};

    const [total, data] = await Promise.all([
      this.prisma.laboratoryOrder.count({ where }),
      this.prisma.laboratoryOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderedAt: "desc" },
        include: {
          visit: {
            select: {
              id: true,
              startedAt: true,
              patient: { select: { id: true, mrn: true, name: true } }
            }
          },
          doctor: { select: { id: true, code: true, name: true, specialty: true } },
          results: true
        }
      })
    ]);

    return { data, meta: { page, limit, total } };
  }

  async dailySummary(dateIso?: string) {
    const date = dateIso ? new Date(dateIso) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid date parameter");

    const from = startOfDay(date);
    const to = endOfDay(date);

    const [menunggu, proses, selesai] = await Promise.all([
      this.prisma.laboratoryOrder.count({
        where: { orderedAt: { gte: from, lte: to }, status: "MENUNGGU" }
      }),
      this.prisma.laboratoryOrder.count({
        where: { orderedAt: { gte: from, lte: to }, status: "PROSES" }
      }),
      this.prisma.laboratoryOrder.count({
        where: { orderedAt: { gte: from, lte: to }, status: "SELESAI" }
      })
    ]);

    return {
      date: from.toISOString().slice(0, 10),
      counts: {
        menunggu,
        proses,
        selesai,
        total: menunggu + proses + selesai
      }
    };
  }

  async get(id: string) {
    const order = await this.prisma.laboratoryOrder.findUnique({
      where: { id },
      include: {
        visit: {
          select: {
            id: true,
            startedAt: true,
            patient: { select: { id: true, mrn: true, name: true } },
            doctor: { select: { id: true, code: true, name: true } }
          }
        },
        doctor: { select: { id: true, code: true, name: true, specialty: true } },
        results: { orderBy: { resultedAt: "desc" } }
      }
    });
    if (!order) throw new NotFoundException("Laboratory order not found");
    return order;
  }

  async create(actorId: string | undefined, input: CreateLaboratoryOrderDto) {
    await this.ensureVisitAndDoctor(input.visitId, input.doctorId);

    const order = await this.prisma.laboratoryOrder.create({
      data: {
        visitId: input.visitId,
        doctorId: input.doctorId,
        testType: input.testType,
        notes: input.notes,
        status: "MENUNGGU"
      }
    });

    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      entity: "LaboratoryOrder",
      entityId: order.id,
      metadata: { testType: order.testType }
    });

    return this.get(order.id);
  }

  async setStatus(actorId: string | undefined, id: string, status: LaboratoryOrderStatus) {
    await this.get(id);

    await this.prisma.laboratoryOrder.update({ where: { id }, data: { status } });
    await this.audit.create({
      actorId,
      action: "status",
      entity: "LaboratoryOrder",
      entityId: id,
      metadata: { status }
    });

    return this.get(id);
  }

  async addResult(actorId: string | undefined, orderId: string, input: CreateLaboratoryResultDto) {
    const order = await this.get(orderId);

    const result = await this.prisma.laboratoryResult.create({
      data: {
        orderId,
        parameter: input.parameter,
        value: input.value,
        unit: input.unit,
        normalRange: input.normalRange,
        notes: input.notes
      }
    });

    if (order.status === "MENUNGGU") {
      await this.prisma.laboratoryOrder.update({ where: { id: orderId }, data: { status: "PROSES" } });
    }

    await this.audit.create({
      actorId,
      action: AuditAction.LAB_RESULT_UPLOAD,
      entity: "LaboratoryResult",
      entityId: result.id,
      metadata: { orderId, parameter: result.parameter }
    });

    return this.get(orderId);
  }
}
