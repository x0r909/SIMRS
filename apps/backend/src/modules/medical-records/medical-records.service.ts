import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction, MedicalRecordStatus } from "@prisma/client";

import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { EncryptionService } from "../encryption/encryption.service";

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
    private readonly encryption: EncryptionService
  ) {}

  async getByVisit(visitId: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { visitId },
      include: { diagnoses: true, prescriptions: { include: { items: true } } }
    });
    if (!record) throw new NotFoundException("Medical record not found");
    return this.decryptRecord(record);
  }

  async get(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: { diagnoses: true, prescriptions: { include: { items: true } }, visit: true }
    });
    if (!record) throw new NotFoundException("Medical record not found");
    return this.decryptRecord(record);
  }

  async create(visitId: string, actorId: string | undefined, data: Record<string, unknown>) {
    const existing = await this.prisma.medicalRecord.findUnique({ where: { visitId } });
    if (existing) throw new BadRequestException("Medical record already exists for this visit");

    const record = await this.prisma.medicalRecord.create({
      data: {
        visitId,
        chiefComplaint: data.chiefComplaint as string | undefined,
        chiefComplaintEncrypted: this.encryption.encryptOptional(data.chiefComplaint as string),
        subjectiveEncrypted: this.encryption.encryptOptional(data.subjective as string),
        objectiveEncrypted: this.encryption.encryptOptional(data.objective as string),
        assessmentEncrypted: this.encryption.encryptOptional(data.assessment as string),
        planEncrypted: this.encryption.encryptOptional(data.plan as string),
        vitalSigns: data.vitalSigns as object | undefined,
        status: "DRAFT"
      }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.MEDICAL_RECORD_UPDATE,
      entity: "MedicalRecord",
      entityId: record.id
    });
    return this.get(record.id);
  }

  async update(id: string, actorId: string | undefined, data: Record<string, unknown>) {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Medical record not found");
    if (record.status === "FINAL" || record.status === "ARCHIVED") {
      throw new BadRequestException("Cannot edit finalized medical record");
    }

    await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        chiefComplaint: data.chiefComplaint as string | undefined,
        chiefComplaintEncrypted: data.chiefComplaint
          ? this.encryption.encryptField(data.chiefComplaint as string)
          : undefined,
        subjectiveEncrypted: data.subjective
          ? this.encryption.encryptField(data.subjective as string)
          : undefined,
        objectiveEncrypted: data.objective
          ? this.encryption.encryptField(data.objective as string)
          : undefined,
        assessmentEncrypted: data.assessment
          ? this.encryption.encryptField(data.assessment as string)
          : undefined,
        planEncrypted: data.plan ? this.encryption.encryptField(data.plan as string) : undefined,
        vitalSigns: data.vitalSigns as object | undefined,
        status: (data.status as MedicalRecordStatus) ?? undefined
      }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.MEDICAL_RECORD_UPDATE,
      entity: "MedicalRecord",
      entityId: id
    });
    return this.get(id);
  }

  async finalize(id: string, actorId: string | undefined, signatureData?: string) {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Medical record not found");

    await this.prisma.medicalRecord.update({
      where: { id },
      data: { status: "FINAL", signedAt: new Date(), signatureData }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.MEDICAL_RECORD_FINALIZE,
      entity: "MedicalRecord",
      entityId: id
    });
    return this.get(id);
  }

  async addendum(id: string, actorId: string | undefined, text: string) {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Medical record not found");
    if (record.status !== "FINAL") throw new BadRequestException("Addendum only for finalized records");

    const prev = record.addendum ?? "";
    await this.prisma.medicalRecord.update({
      where: { id },
      data: { addendum: prev ? `${prev}\n---\n${text}` : text }
    });
    await this.audit.create({
      actorId,
      action: AuditAction.MEDICAL_RECORD_UPDATE,
      entity: "MedicalRecord",
      entityId: id,
      metadata: { type: "addendum" }
    });
    return this.get(id);
  }

  private decryptRecord(record: Record<string, unknown>) {
    return {
      ...record,
      chiefComplaint:
        record.chiefComplaint ??
        this.encryption.decryptOptional(record.chiefComplaintEncrypted as string),
      subjective: this.encryption.decryptOptional(record.subjectiveEncrypted as string),
      objective: this.encryption.decryptOptional(record.objectiveEncrypted as string),
      assessment: this.encryption.decryptOptional(record.assessmentEncrypted as string),
      plan: this.encryption.decryptOptional(record.planEncrypted as string)
    };
  }
}
