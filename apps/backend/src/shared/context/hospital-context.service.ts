/**
 * @file hospital-context.service.ts
 * @path apps/backend/src/shared/context/hospital-context.service.ts
 * @description Request context: hospital/department scope per request.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, OnModuleInit } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HospitalContextService implements OnModuleInit {
  private defaultHospitalId: string | null = null;
  private defaultDepartmentId: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const hospital = await this.prisma.hospital.findFirst({ where: { status: "ACTIVE" } });
    this.defaultHospitalId = hospital?.id ?? null;

    if (hospital) {
      const dept = await this.prisma.department.findFirst({
        where: { hospitalId: hospital.id, code: "UMUM" }
      });
      this.defaultDepartmentId = dept?.id ?? null;
    }
  }

  getDefaultHospitalId(): string {
    if (!this.defaultHospitalId) {
      throw new Error("No default hospital configured");
    }
    return this.defaultHospitalId;
  }

  getDefaultDepartmentId(): string | null {
    return this.defaultDepartmentId;
  }

  async resolveHospitalId(userHospitalId?: string | null): Promise<string> {
    return userHospitalId ?? this.getDefaultHospitalId();
  }
}
