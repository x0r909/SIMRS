import { Controller, Get, Param, Patch, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser("sub") userId: string, @Query() query: PaginationQueryDto) {
    return this.notifications.list(userId, query);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser("sub") userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Patch(":id/read")
  markRead(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser("sub") userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Post()
  create(
    @CurrentUser("sub") userId: string,
    @Body() body: { title: string; message: string; type?: NotificationType }
  ) {
    return this.notifications.create(userId, body);
  }
}
