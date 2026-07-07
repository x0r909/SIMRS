/**
 * @file users.service.ts
 * @path apps/backend/src/modules/users/users.service.ts
 * @description Service bisnis users: logika domain & Prisma. Manajemen pengguna staff: CRUD user, assignment role & departemen.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { AuditAction, Prisma } from "@prisma/client";

import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { JwtPayload } from "../auth/types";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import {
  filterHospitalAssignableRoles,
  HOSPITAL_ASSIGNABLE_ROLES,
  shouldPreserveRolesForHospitalAdmin
} from "./hospital-staff.roles";

type UserListItem = {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  hospitalId?: string | null;
  departmentId?: string | null;
  roles: { role: { id: string; key: string; name: string } }[];
  patientProfile?: {
    id: string;
    mrn: string;
    phone: string | null;
    address: string | null;
    birthDate: Date | null;
  } | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private toPublicUser(user: UserListItem) {
    const { patientProfile, ...rest } = user;
    return {
      ...rest,
      roles: user.roles.map((r) => r.role),
      patientProfile: patientProfile
        ? {
            ...patientProfile,
            birthDate: patientProfile.birthDate?.toISOString() ?? null
          }
        : null
    };
  }

  async get(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: { select: { id: true, key: true, name: true } } } }
      }
    });
    if (!user) throw new NotFoundException("User not found");
    return this.toPublicUser(user);
  }

  private isSystemAdmin(actor?: JwtPayload): boolean {
    return Boolean(actor?.roles?.includes("SYSTEM_ADMIN") || actor?.roles?.includes("admin"));
  }

  private buildListWhere(actor?: JwtPayload): Prisma.UserWhereInput {
    if (this.isSystemAdmin(actor)) {
      return {};
    }

    const where: Prisma.UserWhereInput = {
      NOT: { roles: { some: { role: { key: "SYSTEM_ADMIN" } } } }
    };

    if (actor?.hospitalId) {
      where.hospitalId = actor.hospitalId;
    }

    return where;
  }

  async list(actor?: JwtPayload) {
    const users = await this.prisma.user.findMany({
      where: this.buildListWhere(actor),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        hospitalId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: { select: { id: true, key: true, name: true } } } },
        patientProfile: {
          select: { id: true, mrn: true, phone: true, address: true, birthDate: true }
        }
      }
    });
    return users.map((user: UserListItem) => this.toPublicUser(user));
  }

  listAssignableRoles() {
    return this.prisma.role.findMany({
      where: { key: { in: [...HOSPITAL_ASSIGNABLE_ROLES] } },
      select: { key: true, name: true },
      orderBy: { name: "asc" }
    });
  }

  async create(actorId: string | undefined, input: CreateUserDto, actor?: JwtPayload) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    let hospitalId = input.hospitalId;
    let departmentId = input.departmentId;
    let roleKeys = input.roleKeys;

    if (actor && !this.isSystemAdmin(actor)) {
      if (!actor.hospitalId) {
        throw new ForbiddenException("Akun admin rumah sakit belum terhubung ke rumah sakit");
      }
      hospitalId = actor.hospitalId;
      roleKeys = filterHospitalAssignableRoles(roleKeys ?? []);
      if (roleKeys.length === 0) {
        throw new ForbiddenException("Pilih minimal satu role staff yang valid");
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        status: "ACTIVE",
        hospitalId,
        departmentId
      }
    });

    if (roleKeys?.length) {
      const roles = await this.prisma.role.findMany({ where: { key: { in: roleKeys } } });
      await this.prisma.userRole.createMany({
        data: roles.map((r: any) => ({ userId: user.id, roleId: r.id })),
        skipDuplicates: true
      });
    }

    await this.audit.create({
      actorId,
      action: AuditAction.USER_CREATE,
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email }
    });

    return this.get(user.id);
  }

  private async assertCanManageUser(actor: JwtPayload | undefined, userId: string) {
    if (!actor || this.isSystemAdmin(actor)) return;

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });
    if (!target) throw new NotFoundException("User not found");

    const isSystemUser = target.roles.some((r) => r.role.key === "SYSTEM_ADMIN");
    if (isSystemUser) {
      throw new ForbiddenException("Tidak dapat mengubah akun system admin");
    }

    if (actor.hospitalId && target.hospitalId && target.hospitalId !== actor.hospitalId) {
      throw new ForbiddenException("Pengguna berada di luar rumah sakit Anda");
    }
  }

  async update(actorId: string | undefined, id: string, input: UpdateUserDto, actor?: JwtPayload) {
    await this.assertCanManageUser(actor, id);

    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;
    let roleKeys = input.roleKeys;

    if (actor && !this.isSystemAdmin(actor) && roleKeys !== undefined) {
      const target = await this.prisma.user.findUnique({
        where: { id },
        include: { roles: { include: { role: true } } }
      });
      const targetRoleKeys = target?.roles.map((r) => r.role.key) ?? [];

      if (shouldPreserveRolesForHospitalAdmin(targetRoleKeys)) {
        roleKeys = undefined;
      } else {
        roleKeys = filterHospitalAssignableRoles(roleKeys);
        if ((input.roleKeys?.length ?? 0) > 0 && roleKeys.length === 0) {
          throw new ForbiddenException("Role staff tidak valid untuk rumah sakit ini");
        }
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        name: input.name,
        status: input.status,
        passwordHash,
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {})
      }
    });

    if (roleKeys) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleKeys.length > 0) {
        const roles = await this.prisma.role.findMany({ where: { key: { in: roleKeys } } });
        await this.prisma.userRole.createMany({
          data: roles.map((role: any) => ({ userId: id, roleId: role.id })),
          skipDuplicates: true
        });
      }
    }

    await this.audit.create({ actorId, action: AuditAction.USER_UPDATE, entity: "User", entityId: id });
    return this.get(id);
  }

  async remove(actorId: string | undefined, id: string, actor?: JwtPayload) {
    await this.assertCanManageUser(actor, id);
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException("User not found");
    await this.prisma.user.delete({ where: { id } });
    await this.audit.create({
      actorId,
      action: AuditAction.USER_DELETE,
      entity: "User",
      entityId: id,
      metadata: { email: existing.email }
    });
    return { id };
  }
}

