import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createReadStream } from "fs";
import type { Response } from "express";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { BackupService } from "./backup.service";
import { CreateBackupDto } from "./dto/create-backup.dto";
import { RestoreBackupDto } from "./dto/restore-backup.dto";

@ApiTags("backup")
@Controller("backup")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Get()
  @RequirePermissions("backup.create")
  list(@Query() query: PaginationQueryDto) {
    return this.backup.listBackups(query.page, query.limit);
  }

  @Post("create")
  @RequirePermissions("backup.create")
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateBackupDto) {
    return this.backup.createBackup(actorId, dto.description);
  }

  @Get(":id/download")
  @RequirePermissions("backup.download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const file = await this.backup.downloadBackup(id);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.filename)}"`
    );
    createReadStream(file.path).pipe(res);
  }

  @Get(":id")
  @RequirePermissions("backup.create")
  get(@Param("id") id: string) {
    return this.backup.getBackup(id);
  }

  @Delete(":id")
  @RequirePermissions("backup.delete")
  delete(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.backup.deleteBackup(actorId, id);
  }

  @Post(":id/restore")
  @RequirePermissions("backup.restore")
  restore(
    @CurrentUser("sub") actorId: string,
    @Param("id") id: string,
    @Body() dto: RestoreBackupDto
  ) {
    return this.backup.restoreBackup(actorId, id, dto);
  }
}
