/**
 * @file queues.service.ts
 * @path apps/backend/src/modules/queues/queues.service.ts
 * @description Service bisnis queues: logika domain & Prisma. Antrian poli: nomor antrian, prioritas, status panggilan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { HospitalContextService } from "../../shared/context/hospital-context.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateQueueEntryDto } from "./dto/create-queue-entry.dto";

import type { QueueStatus } from "@prisma/client";

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
export class QueuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
    private readonly hospitalContext: HospitalContextService
  ) {}

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          OR: [
            { patient: { name: { contains: query.q, mode: "insensitive" as const } } },
            { patient: { mrn: { contains: query.q, mode: "insensitive" as const } } },
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } }
          ]
        }
      : undefined;

    const [total, data] = await Promise.all([
      this.prisma.queueEntry.count({ where }),
      this.prisma.queueEntry.findMany({
        where,
        skip,
        take,
        orderBy: [{ date: "desc" }, { number: "desc" }],
        include: {
          patient: { select: { id: true, mrn: true, name: true } },
          doctor: { select: { id: true, code: true, name: true, specialty: true } }
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async dashboard(dateIso?: string) {
    const date = dateIso ? new Date(dateIso) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid date parameter");
    const from = startOfDay(date);
    const to = endOfDay(date);
    const entries = await this.prisma.queueEntry.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: [{ number: "asc" }],
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        doctor: { select: { id: true, code: true, name: true, specialty: true } }
      }
    });
    return entries;
  }

  async get(id: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        doctor: { select: { id: true, code: true, name: true, specialty: true } }
      }
    });
    if (!entry) throw new NotFoundException("Queue entry not found");
    return entry;
  }

  async create(actorId: string | undefined, input: CreateQueueEntryDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Patient not found");

    if (input.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: input.doctorId }, select: { id: true } });
      if (!doctor) throw new NotFoundException("Doctor not found");
    }

    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid queue date");
    const from = startOfDay(date);
    const to = endOfDay(date);
    const agg = await this.prisma.queueEntry.aggregate({
      where: { date: { gte: from, lte: to } },
      _max: { number: true }
    });
    const nextNumber = (agg._max.number ?? 0) + 1;

    const hospitalId = await this.hospitalContext.getDefaultHospitalId();
    const entry = await this.prisma.queueEntry.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        date,
        number: nextNumber,
        status: "WAITING",
        hospitalId,
        departmentId: this.hospitalContext.getDefaultDepartmentId()
      }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      entity: "QueueEntry",
      entityId: entry.id,
      metadata: { number: entry.number, date: entry.date.toISOString() }
    });
    return this.get(entry.id);
  }

  async setStatus(actorId: string | undefined, id: string, status: QueueStatus) {
    await this.get(id);
    await this.prisma.queueEntry.update({ where: { id }, data: { status } });
    await this.audit.create({
      actorId,
      action: "status",
      entity: "QueueEntry",
      entityId: id,
      metadata: { status }
    });
    return this.get(id);
  }
}

