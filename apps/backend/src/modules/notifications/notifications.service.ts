/**
 * @file notifications.service.ts
 * @path apps/backend/src/modules/notifications/notifications.service.ts
 * @description Service bisnis notifications: logika domain & Prisma. Notifikasi in-app untuk pengguna.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where = { userId };
    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async create(userId: string, data: { title: string; message: string; type?: NotificationType; metadata?: object }) {
    return this.prisma.notification.create({
      data: { userId, title: data.title, message: data.message, type: data.type ?? "INFO", metadata: data.metadata }
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundException("Notification not found");
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { success: true };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }
}
