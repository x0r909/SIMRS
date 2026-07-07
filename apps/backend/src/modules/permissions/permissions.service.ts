/**
 * @file permissions.service.ts
 * @path apps/backend/src/modules/permissions/permissions.service.ts
 * @description Service bisnis permissions: logika domain & Prisma. Permission RBAC: daftar hak akses granular per modul.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.permission.findMany({ orderBy: { key: "asc" } });
  }
}

