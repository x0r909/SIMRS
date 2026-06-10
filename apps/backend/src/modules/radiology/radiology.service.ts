import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction, RadiologyOrderStatus } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateRadiologyOrderDto } from "./dto/create-radiology-order.dto";
import { CreateRadiologyResultDto } from "./dto/create-radiology-result.dto";

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
export class RadiologyService {
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
            { examType: { contains: query.q, mode: "insensitive" as const } },
            { status: { contains: query.q, mode: "insensitive" as const } },
            { visit: { patient: { name: { contains: query.q, mode: "insensitive" as const } } } },
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } }
          ]
        }
      : {};

    const [total, data] = await Promise.all([
      this.prisma.radiologyOrder.count({ where }),
      this.prisma.radiologyOrder.findMany({
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
      this.prisma.radiologyOrder.count({
        where: { orderedAt: { gte: from, lte: to }, status: "PENDING" }
      }),
      this.prisma.radiologyOrder.count({
        where: { orderedAt: { gte: from, lte: to }, status: "IN_PROGRESS" }
      }),
      this.prisma.radiologyOrder.count({
        where: { orderedAt: { gte: from, lte: to }, status: "COMPLETED" }
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
    const order = await this.prisma.radiologyOrder.findUnique({
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
    if (!order) throw new NotFoundException("Radiology order not found");
    return order;
  }

  async create(actorId: string | undefined, input: CreateRadiologyOrderDto) {
    await this.ensureVisitAndDoctor(input.visitId, input.doctorId);

    const order = await this.prisma.radiologyOrder.create({
      data: {
        visitId: input.visitId,
        doctorId: input.doctorId,
        examType: input.examType,
        notes: input.notes,
        status: "PENDING"
      }
    });

    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      entity: "RadiologyOrder",
      entityId: order.id,
      metadata: { examType: order.examType }
    });

    return this.get(order.id);
  }

  async setStatus(actorId: string | undefined, id: string, status: RadiologyOrderStatus) {
    await this.get(id);

    await this.prisma.radiologyOrder.update({ where: { id }, data: { status } });
    await this.audit.create({
      actorId,
      action: "status",
      entity: "RadiologyOrder",
      entityId: id,
      metadata: { status }
    });

    return this.get(id);
  }

  async addResult(actorId: string | undefined, orderId: string, input: CreateRadiologyResultDto) {
    const order = await this.get(orderId);

    const result = await this.prisma.radiologyResult.create({
      data: {
        orderId,
        description: input.description,
        impression: input.impression,
        filePath: input.filePath
      }
    });

    if (order.status === "PENDING") {
      await this.prisma.radiologyOrder.update({ where: { id: orderId }, data: { status: "IN_PROGRESS" } });
    }

    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      entity: "RadiologyResult",
      entityId: result.id,
      metadata: { orderId }
    });

    return this.get(orderId);
  }
}
