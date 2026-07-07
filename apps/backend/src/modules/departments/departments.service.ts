/**
 * @file departments.service.ts
 * @path apps/backend/src/modules/departments/departments.service.ts
 * @description Service bisnis departments: logika domain & Prisma. Departemen/poli rumah sakit per institusi.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, NotFoundException } from "@nestjs/common";

import { HospitalContextService } from "../../shared/context/hospital-context.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hospitalContext: HospitalContextService
  ) {}

  async list(hospitalId?: string) {
    const hid = hospitalId ?? this.hospitalContext.getDefaultHospitalId();
    return this.prisma.department.findMany({
      where: { hospitalId: hid },
      orderBy: { name: "asc" }
    });
  }

  async get(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException("Department not found");
    return dept;
  }

  async create(data: { name: string; code: string; description?: string; hospitalId?: string }) {
    const hospitalId = data.hospitalId ?? this.hospitalContext.getDefaultHospitalId();
    return this.prisma.department.create({
      data: { name: data.name, code: data.code, description: data.description, hospitalId }
    });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    await this.get(id);
    return this.prisma.department.update({ where: { id }, data });
  }
}
