import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AppointmentStatus, Prisma } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  private async ensurePatientAndDoctor(patientId: string, doctorId: string) {
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } }),
      this.prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } })
    ]);
    if (!patient) throw new NotFoundException("Patient not found");
    if (!doctor) throw new NotFoundException("Doctor not found");
  }

  private async ensurePatientProfile(userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: userId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Patient profile not found");
  }

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: Prisma.AppointmentWhereInput = query.q
      ? {
          OR: [
            { patient: { name: { contains: query.q, mode: "insensitive" as const } } },
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } }
          ]
        }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledAt: "desc" },
        include: {
          patient: { select: { id: true, mrn: true, name: true } },
          doctor: { select: { id: true, code: true, name: true, specialty: true } },
          visit: { select: { id: true } }
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async listMine(userId: string, query: PaginationQueryDto) {
    await this.ensurePatientProfile(userId);
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: Prisma.AppointmentWhereInput = query.q
      ? {
          patientId: userId,
          OR: [
            { doctor: { name: { contains: query.q, mode: "insensitive" as const } } },
            { notes: { contains: query.q, mode: "insensitive" as const } }
          ]
        }
      : { patientId: userId };

    const [total, data] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledAt: "desc" },
        include: {
          patient: { select: { id: true, mrn: true, name: true } },
          doctor: { select: { id: true, code: true, name: true, specialty: true } },
          visit: { select: { id: true } }
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        doctor: { select: { id: true, code: true, name: true, specialty: true } },
        visit: { select: { id: true } }
      }
    });
    if (!appt) throw new NotFoundException("Appointment not found");
    return appt;
  }

  async create(actorId: string | undefined, input: CreateAppointmentDto) {
    await this.ensurePatientAndDoctor(input.patientId, input.doctorId);
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException("Invalid scheduledAt");

    const appt = await this.prisma.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledAt,
        notes: input.notes
      }
    });
    await this.audit.create({ actorId, action: "create", entity: "Appointment", entityId: appt.id });
    return this.get(appt.id);
  }

  async update(actorId: string | undefined, id: string, input: UpdateAppointmentDto) {
    await this.get(id);

    const nextPatientId = input.patientId;
    const nextDoctorId = input.doctorId;
    if (nextPatientId && nextDoctorId) {
      await this.ensurePatientAndDoctor(nextPatientId, nextDoctorId);
    } else if (nextPatientId) {
      const patient = await this.prisma.patient.findUnique({ where: { id: nextPatientId }, select: { id: true } });
      if (!patient) throw new NotFoundException("Patient not found");
    } else if (nextDoctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: nextDoctorId }, select: { id: true } });
      if (!doctor) throw new NotFoundException("Doctor not found");
    }

    let scheduledAt: Date | undefined;
    if (input.scheduledAt) {
      const parsed = new Date(input.scheduledAt);
      if (Number.isNaN(parsed.getTime())) throw new BadRequestException("Invalid scheduledAt");
      scheduledAt = parsed;
    }

    await this.prisma.appointment.update({
      where: { id },
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledAt,
        notes: input.notes
      }
    });
    await this.audit.create({ actorId, action: "update", entity: "Appointment", entityId: id });
    return this.get(id);
  }

  async setStatus(actorId: string | undefined, id: string, status: AppointmentStatus) {
    await this.get(id);
    await this.prisma.appointment.update({ where: { id }, data: { status } });
    await this.audit.create({
      actorId,
      action: "status",
      entity: "Appointment",
      entityId: id,
      metadata: { status }
    });
    return this.get(id);
  }

  async remove(actorId: string | undefined, id: string) {
    await this.get(id);
    await this.prisma.appointment.delete({ where: { id } });
    await this.audit.create({ actorId, action: "delete", entity: "Appointment", entityId: id });
    return { id };
  }
}

