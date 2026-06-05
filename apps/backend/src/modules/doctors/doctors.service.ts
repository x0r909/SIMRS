import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateDoctorDto } from "./dto/create-doctor.dto";
import { UpdateDoctorDto } from "./dto/update-doctor.dto";

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { code: { contains: query.q, mode: "insensitive" as const } },
            { specialty: { contains: query.q, mode: "insensitive" as const } }
          ]
        }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.doctor.count({ where }),
      this.prisma.doctor.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException("Doctor not found");
    return doctor;
  }

  async create(actorId: string | undefined, input: CreateDoctorDto) {
    const doctor = await this.prisma.doctor.create({
      data: { code: input.code, name: input.name, specialty: input.specialty, phone: input.phone }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      entity: "Doctor",
      entityId: doctor.id,
      metadata: { code: doctor.code }
    });
    return doctor;
  }

  async update(actorId: string | undefined, id: string, input: UpdateDoctorDto) {
    await this.get(id);
    const doctor = await this.prisma.doctor.update({
      where: { id },
      data: { code: input.code, name: input.name, specialty: input.specialty, phone: input.phone }
    });
    await this.audit.create({ actorId, action: AuditAction.OTHER, entity: "Doctor", entityId: id });
    return doctor;
  }

  async remove(actorId: string | undefined, id: string) {
    await this.get(id);
    await this.prisma.doctor.delete({ where: { id } });
    await this.audit.create({ actorId, action: AuditAction.OTHER, entity: "Doctor", entityId: id });
    return { id };
  }
}

