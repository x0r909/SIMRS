/**
 * @file roles.service.ts
 * @path apps/backend/src/modules/roles/roles.service.ts
 * @description Service bisnis roles: logika domain & Prisma. Role RBAC: definisi peran dan assignment permission.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({
      orderBy: { key: "asc" },
      include: { permissions: { include: { permission: true } } }
    });
  }

  create(data: { key: string; name: string; description?: string }) {
    return this.prisma.role.create({ data });
  }

  async setPermissions(roleId: string, permissionKeys: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role not found");

    const perms = await this.prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: perms.map((p: any) => ({ roleId, permissionId: p.id })),
      skipDuplicates: true
    });

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } }
    });
  }
}

