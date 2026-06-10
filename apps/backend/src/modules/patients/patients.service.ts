import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { HospitalContextService } from "../../shared/context/hospital-context.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";

@Injectable()
export class PatientsService {
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
            { name: { contains: query.q, mode: "insensitive" as const } },
            { mrn: { contains: query.q, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [total, data] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException("Patient not found");
    return patient;
  }

  async create(actorId: string | undefined, input: CreatePatientDto) {
    const hospitalId = await this.hospitalContext.getDefaultHospitalId();
    const patient = await this.prisma.patient.create({
      data: {
        mrn: input.mrn,
        name: input.name,
        phone: input.phone,
        address: input.address,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        hospitalId,
        departmentId: this.hospitalContext.getDefaultDepartmentId()
      }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.PATIENT_CREATE,
      entity: "Patient",
      entityId: patient.id,
      metadata: { mrn: patient.mrn }
    });
    return patient;
  }

  async update(actorId: string | undefined, id: string, input: UpdatePatientDto) {
    await this.get(id);
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        mrn: input.mrn,
        name: input.name,
        phone: input.phone,
        address: input.address,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined
      }
    });
    await this.audit.create({ actorId, action: AuditAction.PATIENT_UPDATE, entity: "Patient", entityId: id });
    return patient;
  }

  async remove(actorId: string | undefined, id: string) {
    await this.get(id);
    await this.prisma.patient.delete({ where: { id } });
    await this.audit.create({ actorId, action: AuditAction.PATIENT_DELETE, entity: "Patient", entityId: id });
    return { id };
  }
}

