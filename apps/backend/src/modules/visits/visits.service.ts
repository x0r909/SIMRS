import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AppointmentStatus, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { HospitalContextService } from "../../shared/context/hospital-context.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateVisitDto } from "./dto/create-visit.dto";
import { UpdateVisitDto } from "./dto/update-visit.dto";

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
    private readonly hospitalContext: HospitalContextService
  ) {}

  private async ensureRelations(input: CreateVisitDto) {
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } }),
      this.prisma.doctor.findUnique({ where: { id: input.doctorId }, select: { id: true } })
    ]);
    if (!patient) throw new NotFoundException("Patient not found");
    if (!doctor) throw new NotFoundException("Doctor not found");

    if (input.appointmentId) {
      const appt = await this.prisma.appointment.findUnique({ where: { id: input.appointmentId } });
      if (!appt) throw new NotFoundException("Appointment not found");
      if (appt.patientId !== input.patientId || appt.doctorId !== input.doctorId) {
        throw new NotFoundException("Appointment does not match patient and doctor");
      }
    }
  }

  private async ensurePatientProfile(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Patient profile not found");
    return patient.id;
  }

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          OR: [
            { patient: { name: { contains: query.q, mode: "insensitive" as const } } },
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } }
          ]
        }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.visit.count({ where }),
      this.prisma.visit.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: "desc" },
        include: {
          patient: { select: { id: true, mrn: true, name: true } },
          doctor: { select: { id: true, code: true, name: true, specialty: true } },
          appointment: { select: { id: true, status: true, scheduledAt: true } },
          invoice: { select: { id: true, number: true, status: true, total: true } }
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async listMine(userId: string, query: PaginationQueryDto) {
    const patientId = await this.ensurePatientProfile(userId);
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          patientId,
          OR: [
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } },
            { complaint: { contains: query.q, mode: "insensitive" as const } },
            { diagnosis: { contains: query.q, mode: "insensitive" as const } }
          ]
        }
      : { patientId };

    const [total, data] = await Promise.all([
      this.prisma.visit.count({ where }),
      this.prisma.visit.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: "desc" },
        include: {
          patient: { select: { id: true, mrn: true, name: true } },
          doctor: { select: { id: true, code: true, name: true, specialty: true } },
          appointment: { select: { id: true, status: true, scheduledAt: true } },
          invoice: { select: { id: true, number: true, status: true, total: true } }
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        doctor: { select: { id: true, code: true, name: true, specialty: true } },
        appointment: { select: { id: true, status: true, scheduledAt: true } },
        invoice: { include: { items: true } }
      }
    });
    if (!visit) throw new NotFoundException("Visit not found");
    return visit;
  }

  async create(actorId: string | undefined, input: CreateVisitDto) {
    await this.ensureRelations(input);

    const hospitalId = await this.hospitalContext.getDefaultHospitalId();
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: input.doctorId },
      select: { departmentId: true }
    });
    const visit = await this.prisma.visit.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentId: input.appointmentId,
        complaint: input.complaint,
        hospitalId,
        departmentId: doctor?.departmentId ?? this.hospitalContext.getDefaultDepartmentId()
      }
    });

    if (input.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: { status: AppointmentStatus.IN_PROGRESS }
      });
    }

    await this.audit.create({ actorId, action: AuditAction.MEDICAL_RECORD_UPDATE, entity: "Visit", entityId: visit.id });
    return this.get(visit.id);
  }

  async update(actorId: string | undefined, id: string, input: UpdateVisitDto) {
    await this.get(id);

    if (input.patientId) {
      const patient = await this.prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } });
      if (!patient) throw new NotFoundException("Patient not found");
    }
    if (input.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: input.doctorId }, select: { id: true } });
      if (!doctor) throw new NotFoundException("Doctor not found");
    }
    if (input.appointmentId) {
      const appt = await this.prisma.appointment.findUnique({ where: { id: input.appointmentId }, select: { id: true } });
      if (!appt) throw new NotFoundException("Appointment not found");
    }

    await this.prisma.visit.update({
      where: { id },
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentId: input.appointmentId,
        complaint: input.complaint,
        diagnosis: input.diagnosis,
        endedAt: input.endedAt ? new Date(input.endedAt) : undefined
      }
    });
    await this.audit.create({ actorId, action: AuditAction.MEDICAL_RECORD_UPDATE, entity: "Visit", entityId: id });
    return this.get(id);
  }

  async end(actorId: string | undefined, id: string) {
    const visit = await this.get(id);
    await this.prisma.visit.update({ where: { id }, data: { endedAt: new Date() } });

    if (visit.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: visit.appointmentId },
        data: { status: AppointmentStatus.COMPLETED }
      });
    }

    await this.audit.create({ actorId, action: "end", entity: "Visit", entityId: id });
    return this.get(id);
  }
}

