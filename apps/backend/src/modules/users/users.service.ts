import { Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { AuditAction } from "@prisma/client";

import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

type UserListItem = {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  roles: { role: { id: string; key: string; name: string } }[];
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
    return {
      ...user,
      roles: user.roles.map((r) => r.role)
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

  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
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
    return users.map((user: any) => this.toPublicUser(user));
  }

  async create(actorId: string | undefined, input: CreateUserDto) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash, status: "ACTIVE" }
    });

    if (input.roleKeys?.length) {
      const roles = await this.prisma.role.findMany({ where: { key: { in: input.roleKeys } } });
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

  async update(actorId: string | undefined, id: string, input: UpdateUserDto) {
    await this.get(id);

    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;
    await this.prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        name: input.name,
        status: input.status,
        passwordHash
      }
    });

    if (input.roleKeys) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (input.roleKeys.length > 0) {
        const roles = await this.prisma.role.findMany({ where: { key: { in: input.roleKeys } } });
        await this.prisma.userRole.createMany({
          data: roles.map((role: any) => ({ userId: id, roleId: role.id })),
          skipDuplicates: true
        });
      }
    }

    await this.audit.create({ actorId, action: AuditAction.USER_UPDATE, entity: "User", entityId: id });
    return this.get(id);
  }

  async remove(actorId: string | undefined, id: string) {
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

