/**
 * @file files.controller.ts
 * @path apps/backend/src/modules/files/files.controller.ts
 * @description Controller REST API files: endpoint HTTP. Upload/download file ke MinIO (hasil lab, radiologi, lampiran).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";
import { MinioService } from "../../shared/storage/minio.service";

import { FilesService } from "./files.service";

@ApiTags("files")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("files")
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly minio: MinioService
  ) {}

  @RequirePermissions("files.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.files.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("files.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.files.get(id);
  }

  @RequirePermissions("files.read")
  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const file = await this.files.get(id);
    const stream = await this.minio.client.getObject(file.bucket, file.objectKey);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.filename)}"`);
    stream.pipe(res);
  }

  @RequirePermissions("files.write")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary"
        }
      },
      required: ["file"]
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  @Post("upload")
  upload(@CurrentUser("sub") actorId: string, @UploadedFile() file: Express.Multer.File) {
    return this.files.upload(actorId, file);
  }
}

