/**
 * @file hospitals.service.ts
 * @path apps/backend/src/modules/hospitals/hospitals.service.ts
 * @description Service bisnis hospitals: logika domain & Prisma. Data rumah sakit: profil institusi, pengaturan RS.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.hospital.findMany({ orderBy: { name: "asc" } });
  }

  async get(id: string) {
    const hospital = await this.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) throw new NotFoundException("Hospital not found");
    return hospital;
  }

  async getDefault() {
    const hospital = await this.prisma.hospital.findFirst({ where: { status: "ACTIVE" } });
    if (!hospital) throw new NotFoundException("No hospital configured");
    return hospital;
  }

  async update(id: string, data: { name?: string; address?: string; phone?: string; email?: string; logoUrl?: string }) {
    await this.get(id);
    return this.prisma.hospital.update({ where: { id }, data });
  }
}
